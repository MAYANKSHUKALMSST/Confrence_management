import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ── Get profile by user ID ──────────────────────────────────────────────────

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const requester = req.user;
    if (requester.id !== req.params.id && requester.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this profile' });
    }

    const user = db.get(
      'SELECT id, email, full_name, department, role, avatar_url, created_at, updated_at FROM users WHERE id = ?',
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

// ── Update profile ──────────────────────────────────────────────────────────

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const requester = req.user;
    if (requester.id !== req.params.id && requester.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const { full_name, department, avatar_url } = req.body;
    const now = new Date().toISOString();

    db.run(
      'UPDATE users SET full_name = ?, department = ?, avatar_url = ?, updated_at = ? WHERE id = ?',
      [full_name, department, avatar_url || '', now, req.params.id]
    );

    const updated = db.get(
      'SELECT id, email, full_name, department, role, avatar_url, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
