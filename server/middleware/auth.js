import jwt from 'jsonwebtoken';
import db from '../db.js';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const secret = getSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    const user = db.get('SELECT id, email, full_name, department, role FROM users WHERE id = ?', [decoded.userId]);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

  if (token) {
    try {
      const secret = getSecret();
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
      const user = db.get('SELECT id, email, full_name, department, role FROM users WHERE id = ?', [decoded.userId]);
      if (user) req.user = user;
    } catch (err) {
      // Token invalid, continue without user
    }
  }
  next();
}
