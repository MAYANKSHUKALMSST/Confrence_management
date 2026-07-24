import { Router } from 'express';
import { randomUUID } from 'crypto';
import sanitizeHtml from 'sanitize-html';
import rateLimit from 'express-rate-limit';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import { format, addHours, parseISO } from 'date-fns';
import pkg from 'rrule';
const { RRule } = pkg;

const router = Router();

// ── List bookings (authenticated) ──────────────────────────────────────────

router.get('/', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    let bookings;

    if (user.role === 'admin') {
      // Admin sees all bookings with profile info
      bookings = db.all(`
        SELECT b.*, u.full_name as profile_full_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.start_time ASC
      `);
    } else {
      // Regular users see their own + confirmed bookings
      bookings = db.all(`
        SELECT b.*, u.full_name as profile_full_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.user_id = ? OR b.status = 'confirmed'
        ORDER BY b.start_time ASC
      `, [user.id]);
    }

    // Shape to match frontend expectations
    const shaped = bookings.map(b => ({
      id: b.id,
      user_id: b.user_id,
      room: b.room,
      title: b.title,
      department: b.department,
      attendees: b.attendees,
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
      created_at: b.created_at,
      updated_at: b.updated_at,
      profiles: b.profile_full_name ? { full_name: b.profile_full_name } : null,
    }));

    res.json(shaped);
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Public: confirmed bookings (for room display, no auth) ─────────────────

router.get('/confirmed', (req, res) => {
  try {
    const { from, to } = req.query;
    let bookings;

    if (from && to) {
      bookings = db.all(`
        SELECT * FROM bookings
        WHERE status = 'confirmed'
          AND start_time >= ? AND start_time <= ?
        ORDER BY start_time ASC
      `, [from, to]);
    } else {
      bookings = db.all(`
        SELECT * FROM bookings
        WHERE status = 'confirmed'
        ORDER BY start_time ASC
      `);
    }

    res.json(bookings);
  } catch (err) {
    console.error('Confirmed bookings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Create booking ─────────────────────────────────────────────────────────
const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 bookings per minute
  message: { error: 'Booking creation rate limit exceeded. Please wait a moment.' }
});

// ── Helper: Check for booking overlaps ─────────────────────────────────────
const hasOverlap = (room, start, end, excludeId = null) => {
  const statusToExcl = 'rejected';
  const query = excludeId 
    ? "SELECT id FROM bookings WHERE room = ? AND status != ? AND id != ? AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))"
    : "SELECT id FROM bookings WHERE room = ? AND status != ? AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?))";
  
  const params = excludeId 
    ? [room, statusToExcl, excludeId, end, start, end, start, start, end]
    : [room, statusToExcl, end, start, end, start, start, end];
    
  return !!db.get(query, params);
};

router.post('/', authenticateToken, bookingLimiter, (req, res) => {
  try {
    let { room, title, department, attendees, attendee_emails, meeting_link, notes, start_time, end_time } = req.body;
    const user = req.user;

    // Time Validation
    const now = new Date().toISOString();
    if (start_time < now) {
      return res.status(400).json({ error: 'Start time must be in the future' });
    }
    if (end_time <= start_time) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Overlap Check
    if (hasOverlap(room, start_time, end_time)) {
      return res.status(400).json({ error: 'Room is already booked for this time slot' });
    }

    // Sanitization
    const sanitizeOptions = { allowedTags: [], allowedAttributes: {} };
    room = sanitizeHtml(room, sanitizeOptions);
    title = sanitizeHtml(title, sanitizeOptions);
    department = sanitizeHtml(department, sanitizeOptions);
    attendees = sanitizeHtml(attendees || '', sanitizeOptions);
    meeting_link = sanitizeHtml(meeting_link || '', sanitizeOptions);
    notes = sanitizeHtml(notes || '', sanitizeOptions);
    // Sanitize and validate attendee emails
    const rawEmails = (attendee_emails || '').split(',').map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    attendee_emails = rawEmails.join(',');

    if (!room || !title || !department || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Dynamic Room Check
    const roomExists = db.get('SELECT name FROM rooms WHERE name = ?', [room]);
    if (!roomExists) {
      return res.status(400).json({ error: 'Invalid room selected' });
    }

    const { recurrence } = req.body;
    let { recurrence_rule } = req.body;
    const recurrence_id = (recurrence && recurrence !== 'none') || recurrence_rule ? randomUUID() : null;

    if (recurrence && recurrence !== 'none' && !recurrence_rule) {
      const freqMap = {
        daily: RRule.DAILY,
        weekly: RRule.WEEKLY,
        biweekly: RRule.WEEKLY,
        monthly: RRule.MONTHLY,
      };

      const rule = new RRule({
        freq: freqMap[recurrence],
        interval: recurrence === 'biweekly' ? 2 : 1,
        dtstart: parseISO(start_time),
        count: 10,
      });
      recurrence_rule = rule.toString();
    }

    let bookingsToCreate = [{ start: start_time, end: end_time }];

    if (recurrence_rule) {
      try {
        const rule = RRule.fromString(recurrence_rule);
        // Limit to 3 months
        const limitDate = new Date();
        limitDate.setMonth(limitDate.getMonth() + 3);
        
        const dates = rule.between(parseISO(start_time), limitDate);
        const duration = new Date(end_time).getTime() - new Date(start_time).getTime();

        bookingsToCreate = dates.map(date => {
          const s = date.toISOString();
          const e = new Date(date.getTime() + duration).toISOString();
          return { start: s, end: e };
        });
      } catch (err) {
        console.error('RRule generation error:', err);
        return res.status(400).json({ error: 'Invalid recurrence parameters' });
      }
    }

    const createdBookings = [];
    for (const bTime of bookingsToCreate) {
      // Check overlap for each slot in the series
      if (hasOverlap(room, bTime.start, bTime.end)) {
        if (recurrence_rule) continue; // Skip clashing instances in a series
        return res.status(400).json({ error: 'Room is already booked for this time slot' });
      }

      const id = randomUUID();
      db.run(
        'INSERT INTO bookings (id, user_id, room, title, department, attendees, attendee_emails, meeting_link, notes, start_time, end_time, status, created_at, updated_at, recurrence_id, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, user.id, room, title, department, attendees || '', attendee_emails || '', meeting_link || '', notes || '', bTime.start, bTime.end, 'confirmed', now, now, recurrence_id, recurrence_rule || null]
      );
      createdBookings.push(db.get('SELECT * FROM bookings WHERE id = ?', [id]));
    }

    if (createdBookings.length === 0) {
      return res.status(400).json({ error: 'Could not create any bookings in the series due to conflicts' });
    }

    const booking = createdBookings[0];
    
    // Broadcast update
    req.app.get('io').emit('booking_created', { bookings: createdBookings });

    // Send acknowledgement email
    const startStr = format(new Date(booking.start_time), 'PPP p');
    const endStr = format(new Date(booking.end_time), 'p');
    
    sendEmail({
      to: user.email,
      subject: `Booking Confirmed: ${booking.title}`,
      text: `Hello ${user.full_name},\n\nYour booking for "${booking.title}" in room "${booking.room}" is confirmed.\n\nDetails:\n- Room: ${booking.room}\n- Time: ${startStr} - ${endStr}\n${booking.meeting_link ? `- Link: ${booking.meeting_link}\n` : ''}${booking.notes ? `- Note: ${booking.notes}\n` : ''}- Status: Confirmed\n\nBest regards,\nRoom Booking System`,
      html: `
        <h3>Hello ${user.full_name},</h3>
        <p>Your booking for <strong>"${booking.title}"</strong> in room <strong>"${booking.room}"</strong> is <strong>confirmed</strong>.</p>
        <p><strong>Details:</strong><br>
        - <strong>Room:</strong> ${booking.room}<br>
        - <strong>Time:</strong> ${startStr} - ${endStr}<br>
        ${booking.meeting_link ? `- <strong>Meeting Link:</strong> <a href="${booking.meeting_link}">${booking.meeting_link}</a><br>` : ''}
        ${booking.notes ? `- <strong>Note:</strong> ${booking.notes}<br>` : ''}
        - <strong>Status:</strong> Confirmed</p>
        <p>Best regards,<br>Room Booking System</p>
      `
    }).catch(err => console.error('Failed to send booking confirmation email:', err));

    // Send invites to all attendees
    if (booking.attendee_emails) {
      const attendeeList = booking.attendee_emails.split(',').map(e => e.trim()).filter(Boolean);
      for (const attendeeEmail of attendeeList) {
        sendEmail({
          to: attendeeEmail,
          subject: `Meeting Invite: ${booking.title}`,
          text: `Hello,\n\nYou have been invited to the following meeting:\n\n📅 ${booking.title}\n🏢 Room: ${booking.room}\n⏰ Time: ${startStr} - ${endStr}\n${booking.meeting_link ? `🔗 Link: ${booking.meeting_link}\n` : ''}${booking.notes ? `📝 Note: ${booking.notes}\n` : ''}👤 Organizer: ${user.full_name}\n\nPlease make a note of this in your calendar.\n\nBest regards,\nRoom Booking System`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; color: white;">
                <h2 style="margin: 0;">📅 Meeting Invite</h2>
                <p style="margin: 5px 0 0; opacity: 0.9;">You have been invited to a meeting</p>
              </div>
              <div style="padding: 24px;">
                <h3 style="margin-top: 0; color: #1a1a2e;">${booking.title}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #666; width: 110px;">🏢 Room</td><td style="padding: 8px 0; font-weight: 600;">${booking.room}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">⏰ Time</td><td style="padding: 8px 0; font-weight: 600;">${startStr} – ${endStr}</td></tr>
                  ${booking.meeting_link ? `<tr><td style="padding: 8px 0; color: #666;">🔗 Meeting Link</td><td style="padding: 8px 0; font-weight: 600;"><a href="${booking.meeting_link}">${booking.meeting_link}</a></td></tr>` : ''}
                  ${booking.notes ? `<tr><td style="padding: 8px 0; color: #666;">📝 Note</td><td style="padding: 8px 0; font-weight: 600;">${booking.notes}</td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #666;">👤 Organizer</td><td style="padding: 8px 0; font-weight: 600;">${user.full_name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">🏷️ Department</td><td style="padding: 8px 0; font-weight: 600;">${department}</td></tr>
                </table>
                <p style="margin-top: 16px; color: #555;">Please make a note of this in your calendar.</p>
              </div>
              <div style="background: #f8f8f8; padding: 12px 24px; font-size: 12px; color: #999;">
                This email was sent by the Room Booking System.
              </div>
            </div>
          `
        }).catch(err => console.error(`Failed to send invite to ${attendeeEmail}:`, err));
      }
    }

    res.json(booking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update booking status (admin only) ──────────────────────────────────────

router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Protection against redundant notifications
    if (booking.status === status) {
      return res.json(booking);
    }

    const now = new Date().toISOString();
    db.run(
      'UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?',
      [status, now, req.params.id]
    );

    // Create notification for the booking owner
    const message = status === 'confirmed'
      ? `Your booking "${booking.title}" for ${booking.room} has been approved!`
      : `Your booking "${booking.title}" for ${booking.room} has been rejected.`;

    db.run(
      'INSERT INTO notifications (id, user_id, booking_id, message, created_at) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), booking.user_id, booking.id, message, now]
    );

    const updated = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    const requester = db.get('SELECT email, full_name FROM users WHERE id = ?', [booking.user_id]);

    const startStr = format(new Date(booking.start_time), 'PPP p');
    const endStr = format(new Date(booking.end_time), 'p');
    const statusTitle = status === 'confirmed' ? 'Approved' : 'Rejected';

    // 1. Email the booking owner (requester)
    if (requester) {
      sendEmail({
        to: requester.email,
        subject: `Booking ${statusTitle}: ${booking.title}`,
        text: `Hello ${requester.full_name},\n\nYour booking request for "${booking.title}" in room "${booking.room}" has been ${status === 'confirmed' ? 'approved' : 'rejected'}.\n\nDetails:\n- Room: ${booking.room}\n- Time: ${startStr} - ${endStr}\n${booking.meeting_link ? `- Link: ${booking.meeting_link}\n` : ''}${booking.notes ? `- Note: ${booking.notes}\n` : ''}- Status: ${statusTitle}\n\nBest regards,\nRoom Booking System`,
        html: `
          <h3>Hello ${requester.full_name},</h3>
          <p>Your booking request for <strong>"${booking.title}"</strong> in room <strong>"${booking.room}"</strong> has been <strong>${status === 'confirmed' ? 'approved' : 'rejected'}</strong>.</p>
          <p><strong>Details:</strong><br>
          - <strong>Room:</strong> ${booking.room}<br>
          - <strong>Time:</strong> ${startStr} - ${endStr}<br>
          ${booking.meeting_link ? `- <strong>Meeting Link:</strong> <a href="${booking.meeting_link}">${booking.meeting_link}</a><br>` : ''}
          ${booking.notes ? `- <strong>Note:</strong> ${booking.notes}<br>` : ''}
          - <strong>Status:</strong> ${statusTitle}</p>
          <p>Best regards,<br>Room Booking System</p>
        `
      }).catch(err => console.error('Failed to send status update email to requester:', err));
    }

    // 2. If CONFIRMED, also email all attendees
    if (status === 'confirmed' && booking.attendee_emails) {
      const attendeeList = booking.attendee_emails.split(',').map(e => e.trim()).filter(Boolean);
      for (const attendeeEmail of attendeeList) {
        sendEmail({
          to: attendeeEmail,
          subject: `Meeting Invite: ${booking.title}`,
          text: `Hello,\n\nYou have been invited to the following meeting:\n\n📅 ${booking.title}\n🏢 Room: ${booking.room}\n⏰ Time: ${startStr} - ${endStr}\n${booking.meeting_link ? `🔗 Link: ${booking.meeting_link}\n` : ''}${booking.notes ? `📝 Note: ${booking.notes}\n` : ''}👤 Organizer: ${requester?.full_name || 'N/A'}\n\nPlease make a note of this in your calendar.\n\nBest regards,\nRoom Booking System`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; color: white;">
                <h2 style="margin: 0;">📅 Meeting Invite</h2>
                <p style="margin: 5px 0 0; opacity: 0.9;">You have been invited to a meeting</p>
              </div>
              <div style="padding: 24px;">
                <h3 style="margin-top: 0; color: #1a1a2e;">${booking.title}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #666; width: 110px;">🏢 Room</td><td style="padding: 8px 0; font-weight: 600;">${booking.room}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">⏰ Time</td><td style="padding: 8px 0; font-weight: 600;">${startStr} – ${endStr}</td></tr>
                  ${booking.meeting_link ? `<tr><td style="padding: 8px 0; color: #666;">🔗 Meeting Link</td><td style="padding: 8px 0; font-weight: 600;"><a href="${booking.meeting_link}">${booking.meeting_link}</a></td></tr>` : ''}
                  ${booking.notes ? `<tr><td style="padding: 8px 0; color: #666;">📝 Note</td><td style="padding: 8px 0; font-weight: 600;">${booking.notes}</td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #666;">👤 Organizer</td><td style="padding: 8px 0; font-weight: 600;">${requester?.full_name || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px 0; color: #666;">🏷️ Department</td><td style="padding: 8px 0; font-weight: 600;">${booking.department}</td></tr>
                </table>
                <p style="margin-top: 16px; color: #555;">Please make a note of this in your calendar.</p>
              </div>
              <div style="background: #f8f8f8; padding: 12px 24px; font-size: 12px; color: #999;">
                This email was sent by the Room Booking System.
              </div>
            </div>
          `
        }).catch(err => console.error(`Failed to send invite to ${attendeeEmail}:`, err));
      }
    }

    res.json(updated);
    // Broadcast update
    req.app.get('io').emit('booking_updated', updated);
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update booking (Modify) ────────────────────────────────────────────────
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    let { room, title, department, attendees, attendee_emails, meeting_link, notes, start_time, end_time } = req.body;

    // Sanitization
    const sanitizeOptions = { allowedTags: [], allowedAttributes: {} };
    room = sanitizeHtml(room, sanitizeOptions);
    title = sanitizeHtml(title, sanitizeOptions);
    department = sanitizeHtml(department, sanitizeOptions);
    attendees = sanitizeHtml(attendees || '', sanitizeOptions);
    meeting_link = sanitizeHtml(meeting_link || '', sanitizeOptions);
    notes = sanitizeHtml(notes || '', sanitizeOptions);
    const rawEmailsPut = (attendee_emails || '').split(',').map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    attendee_emails = rawEmailsPut.join(',');

    if (!room || !title || !department || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Time Validation
    if (end_time <= start_time) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Status Lockdown: If a user modifies a confirmed/rejected booking, keep it as confirmed
    let newStatus = booking.status;
    if (user.role !== 'admin' && (booking.room !== room || booking.start_time !== start_time || booking.end_time !== end_time)) {
      newStatus = 'confirmed';
    }

    // Overlap Check (Excluding self)
    if (hasOverlap(room, start_time, end_time, req.params.id)) {
      return res.status(400).json({ error: 'Room is already booked for this time slot' });
    }

    const now = new Date().toISOString();
    db.run(
      'UPDATE bookings SET room = ?, title = ?, department = ?, attendees = ?, attendee_emails = ?, meeting_link = ?, notes = ?, start_time = ?, end_time = ?, status = ?, updated_at = ? WHERE id = ?',
      [room, title, department, attendees || '', attendee_emails || '', meeting_link || '', notes || '', start_time, end_time, newStatus, now, req.params.id]
    );

    const updated = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json(updated);

    // Broadcast update
    req.app.get('io').emit('booking_updated', updated);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Delete booking ──────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const user = req.user;

    const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this booking' });
    }

    // Optional: delete related notifications
    db.run('DELETE FROM notifications WHERE booking_id = ?', [req.params.id]);
    
    db.run('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ success: true });

    // Broadcast update
    req.app.get('io').emit('booking_deleted', { id: req.params.id });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
