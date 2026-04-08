import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ── Get profile by user ID ──────────────────────────────────────────────────

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = db.get(
      'SELECT id, full_name, department, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
