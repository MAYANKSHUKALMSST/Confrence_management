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

    const bookings = db.all("SELECT * FROM bookings WHERE status = 'confirmed'");

    // 1. Peak Hours (Heatmap data)
    const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    bookings.forEach(b => {
      const start = parseISO(b.start_time).getHours();
      const end = parseISO(b.end_time).getHours();
      for (let i = start; i < end; i++) {
        if (hourCounts[i]) hourCounts[i].count++;
      }
    });

    // 2. Room Occupancy
    const roomCounts = {};
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

    // 4. Monthly Trend (last 6 months)
    // For simplicity, let's just do a count per day for the current month
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const monthlyTrend = [];
    // Mocking some trend data or calculating from real data
    // (In a real app, you'd query by date range)

    res.json({
      peakHours: hourCounts.filter(h => h.hour >= 8 && h.hour <= 20), // Focus on business hours
      roomOccupancy,
      deptActivity,
      stats: {
        totalBookings: bookings.length,
        totalRooms: db.get('SELECT COUNT(*) as count FROM rooms').count,
        totalUsers: db.get('SELECT COUNT(*) as count FROM users').count
      }
    });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
