import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ── List notifications ──────────────────────────────────────────────────────

router.get('/', authenticateToken, (req, res) => {
  try {
    const notifications = db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );

    // Convert is_read from integer to boolean
    const shaped = notifications.map(n => ({
      ...n,
      is_read: !!n.is_read,
    }));

    res.json(shaped);
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Mark one as read ────────────────────────────────────────────────────────

router.patch('/:id/read', authenticateToken, (req, res) => {
  try {
    db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Mark all as read ────────────────────────────────────────────────────────

router.patch('/read-all', authenticateToken, (req, res) => {
  try {
    db.run(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
