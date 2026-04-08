import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

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

router.post('/', authenticateToken, (req, res) => {
  try {
    const { room, title, department, attendees, start_time, end_time } = req.body;
    const user = req.user;

    if (!room || !title || !department || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO bookings (id, user_id, room, title, department, attendees, start_time, end_time, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user.id, room, title, department, attendees || '', start_time, end_time, 'pending', now, now]
    );

    const booking = db.get('SELECT * FROM bookings WHERE id = ?', [id]);
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
    res.json(updated);
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update booking (Modify) ────────────────────────────────────────────────
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    const { room, title, department, attendees, start_time, end_time } = req.body;

    if (!room || !title || !department || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this booking' });
    }

    const now = new Date().toISOString();
    db.run(
      'UPDATE bookings SET room = ?, title = ?, department = ?, attendees = ?, start_time = ?, end_time = ?, updated_at = ? WHERE id = ?',
      [room, title, department, attendees || '', start_time, end_time, now, req.params.id]
    );

    const updated = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json(updated);
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
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
