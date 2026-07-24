import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { format, startOfMonth, endOfMonth, eachHourOfInterval, parseISO } from 'date-fns';

const router = Router();

// ── Get analytics data (admin only) ──────────────────────────────────────────

router.get('/', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const allRooms = db.all('SELECT * FROM rooms ORDER BY name ASC');
    const allBookings = db.all(`
      SELECT b.*, u.full_name as profile_full_name, u.email as profile_email
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.status = 'confirmed'
    `);

    // Filter out "Banyan" and "Banayan" from the analytics
    const rooms = allRooms.filter(r => r.name.toLowerCase() !== 'banyan' && r.name.toLowerCase() !== 'banayan');
    const bookings = allBookings.filter(b => b.room.toLowerCase() !== 'banyan' && b.room.toLowerCase() !== 'banayan');

    // 1. Peak Hours (Heatmap data)
    const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    bookings.forEach(b => {
      const start = parseISO(b.start_time).getHours();
      const end = parseISO(b.end_time).getHours();
      for (let i = start; i < end; i++) {
        if (hourCounts[i]) hourCounts[i].count++;
      }
    });

    // 2. Room Occupancy (Ensure all active rooms are present)
    const roomCounts = {};
    rooms.forEach(r => {
      roomCounts[r.name] = 0;
    });
    bookings.forEach(b => {
      roomCounts[b.room] = (roomCounts[b.room] || 0) + 1;
    });
    const roomOccupancy = Object.entries(roomCounts).map(([name, value]) => ({ name, value }));

    // 3. Department Activity
    const deptCounts = {};
    bookings.forEach(b => {
      deptCounts[b.department] = (deptCounts[b.department] || 0) + 1;
    });
    const deptActivity = Object.entries(deptCounts).map(([name, value]) => ({ name, value }));

    // 4. Monthly Trend (Daily bookings count for the current month)
    const monthlyTrend = [];
    const startMonth = startOfMonth(new Date());
    const endMonth = endOfMonth(new Date());
    const dailyCounts = {};
    
    let currentDay = new Date(startMonth);
    while (currentDay <= endMonth) {
      const dateStr = format(currentDay, 'yyyy-MM-dd');
      dailyCounts[dateStr] = 0;
      currentDay.setDate(currentDay.getDate() + 1);
    }

    bookings.forEach(b => {
      const bDate = parseISO(b.start_time);
      const dateStr = format(bDate, 'yyyy-MM-dd');
      if (dailyCounts[dateStr] !== undefined) {
        dailyCounts[dateStr]++;
      }
    });

    Object.entries(dailyCounts).forEach(([date, count]) => {
      monthlyTrend.push({
        date: format(parseISO(date), 'MMM d'),
        count
      });
    });

    // 5. Additional Stats
    let totalDurationMinutes = 0;
    bookings.forEach(b => {
      const start = parseISO(b.start_time);
      const end = parseISO(b.end_time);
      const diffMinutes = (end - start) / (1000 * 60);
      if (diffMinutes > 0) {
        totalDurationMinutes += diffMinutes;
      }
    });
    const avgDurationMinutes = bookings.length > 0 ? Math.round(totalDurationMinutes / bookings.length) : 0;

    let maxBookings = -1;
    let popularRoom = 'N/A';
    Object.entries(roomCounts).forEach(([name, count]) => {
      if (count > maxBookings && count > 0) {
        maxBookings = count;
        popularRoom = name;
      }
    });

    let maxDeptBookings = -1;
    let activeDept = 'N/A';
    Object.entries(deptCounts).forEach(([name, count]) => {
      if (count > maxDeptBookings && count > 0) {
        maxDeptBookings = count;
        activeDept = name;
      }
    });

    res.json({
      peakHours: hourCounts.filter(h => h.hour >= 8 && h.hour <= 20), // Focus on business hours
      roomOccupancy,
      deptActivity,
      monthlyTrend,
      bookings: bookings.map(b => ({
        id: b.id,
        room: b.room,
        title: b.title,
        department: b.department,
        attendees: b.attendees,
        start_time: b.start_time,
        end_time: b.end_time,
        profile_full_name: b.profile_full_name,
        profile_email: b.profile_email
      })),
      stats: {
        totalBookings: bookings.length,
        totalRooms: rooms.length,
        totalUsers: db.get('SELECT COUNT(*) as count FROM users').count,
        avgDurationMinutes,
        popularRoom,
        activeDept
      }
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
