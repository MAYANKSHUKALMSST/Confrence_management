import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'roombook-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

// ── Sign Up ────────────────────────────────────────────────────────────────

router.post('/signup', (req, res) => {
  try {
    const { email, password, full_name, department } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'User already registered' });
    }

    const id = randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);

    db.run(
      'INSERT INTO users (id, email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email, password_hash, full_name || '', department || 'Technical', 'user']
    );

    const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    const user = db.get('SELECT id, email, full_name, department, role FROM users WHERE id = ?', [id]);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        id: user.id,
        full_name: user.full_name,
        department: user.department,
      },
      role: user.role,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Sign In ────────────────────────────────────────────────────────────────

router.post('/signin', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        id: user.id,
        full_name: user.full_name,
        department: user.department,
      },
      role: user.role,
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get Session ────────────────────────────────────────────────────────────

router.get('/session', authenticateToken, (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      id: user.id,
      full_name: user.full_name,
      department: user.department,
    },
    role: user.role,
  });
});

export default router;
