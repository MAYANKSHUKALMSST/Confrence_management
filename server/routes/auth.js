import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import sanitizeHtml from 'sanitize-html';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const TOKEN_EXPIRY = '15m'; // short-lived access token

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

// ── Sign Up ────────────────────────────────────────────────────────────────

router.post('/signup', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many sign‑up attempts, try later.' }), async (req, res) => {
  try {
    const allowedKeys = ['email', 'password', 'full_name', 'department'];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({ error: 'Invalid properties in request payload' });
    }

    let { email, password, full_name, department } = req.body;

    // Sanitization
    const sanitizeOptions = { allowedTags: [], allowedAttributes: {} };
    email = sanitizeHtml(email || '', sanitizeOptions);
    full_name = sanitizeHtml(full_name || '', sanitizeOptions);
    department = sanitizeHtml(department || '', sanitizeOptions);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const commonPasswords = ['password', 'password123', 'admin123', '12345678'];
    if (commonPasswords.includes(password.toLowerCase())) {
      return res.status(400).json({ error: 'Password is too common/weak' });
    }

    const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'User already registered' });
    }

    const id = randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (id, email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email, password_hash, full_name || '', department || 'Technical', 'user']
    );

    const secret = getSecret();
    const token = jwt.sign({ userId: id }, secret, { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' });
    const user = db.get('SELECT id, email, full_name, department, role FROM users WHERE id = ?', [id]);
    
    // Set HttpOnly cookie - Explicitly false for HTTP troubleshooting
    const isSecure = false;
    res.cookie('token', token, { httpOnly: true, secure: isSecure, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.json({
      user: { id: user.id, email: user.email },
      profile: { id: user.id, full_name: user.full_name, department: user.department },
      role: user.role
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Sign In ────────────────────────────────────────────────────────────────

router.post('/signin', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many login attempts, try later.' }), async (req, res) => {
  try {
    const allowedKeys = ['email', 'password'];
    const extraKeys = Object.keys(req.body).filter(k => !allowedKeys.includes(k));
    if (extraKeys.length > 0) {
      return res.status(400).json({ error: 'Invalid properties in request payload' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid login credentials' });
    }

    const secret = getSecret();
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' });
    
    // Set HttpOnly cookie - Explicitly false for HTTP troubleshooting
    const isSecure = false;
    res.cookie('token', token, { httpOnly: true, secure: isSecure, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    res.json({
      user: { id: user.id, email: user.email },
      profile: { id: user.id, full_name: user.full_name, department: user.department },
      role: user.role
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
    user: { id: user.id, email: user.email },
    profile: { id: user.id, full_name: user.full_name, department: user.department },
    role: user.role,
  });
});

// Logout route – clears HttpOnly cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// ── Transfer Token (for failover) ──────────────────────────────────────────
// Returns the raw JWT so the frontend can pass it to the backup server

router.get('/transfer-token', authenticateToken, (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'No token available' });
  }
  res.json({ token });
});

// ── Accept Token (for failover) ────────────────────────────────────────────
// Validates a JWT from another server (same secret) and sets local cookie

router.get('/accept-token', (req, res) => {
  const { token, redirect: redirectPath } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  try {
    const secret = getSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    
    // Verify user exists in DB
    const user = db.get('SELECT id, email FROM users WHERE id = ?', [decoded.userId]);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Issue a fresh token and set cookie
    const newToken = jwt.sign({ userId: user.id }, secret, { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' });
    const isSecure = false;
    res.cookie('token', newToken, { httpOnly: true, secure: isSecure, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
    
    res.redirect(redirectPath || '/');
  } catch (err) {
    console.error('Accept-token error:', err.message);
    res.redirect('/auth');
  }
});

export default router;
