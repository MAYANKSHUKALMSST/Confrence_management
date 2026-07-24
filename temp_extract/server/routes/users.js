import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Middleware to ensure admin role
const ensureAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply both middlewares to all routes in this file
router.use(authenticateToken);
router.use(ensureAdmin);

// ── List all users ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const users = db.all('SELECT id, email, full_name, department, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Create a new user ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { email, password, full_name, department, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const id = randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (id, email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email, password_hash, full_name || '', department || 'Technical', role || 'user']
    );

    const user = db.get('SELECT id, email, full_name, department, role FROM users WHERE id = ?', [id]);
    res.json(user);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update user password ───────────────────────────────────────────────────
router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [password_hash, now, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update user role ───────────────────────────────────────────────────────
router.put('/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const now = new Date().toISOString();
    db.run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, now, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Delete user ────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // Check if user has bookings
    const bookings = db.get('SELECT id FROM bookings WHERE user_id = ?', [req.params.id]);
    if (bookings) {
      return res.status(400).json({ error: 'Cannot delete user with active bookings' });
    }

    db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
