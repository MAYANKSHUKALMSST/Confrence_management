import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { testConnection } from '../utils/email.js';

const router = Router();

// ── Get email settings (admin only) ──────────────────────────────────────────

router.get('/', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const settings = db.get('SELECT id, smtp_host, smtp_port, email FROM email_settings ORDER BY updated_at DESC LIMIT 1');
    
    // We don't return the app_password for security, or we could return a masked version
    if (settings) {
      res.json({ ...settings, has_password: true });
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error('Get email settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update/Create email settings (admin only) ──────────────────────────────────

router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { smtp_host, smtp_port, email, app_password } = req.body;

    if (!smtp_host || !smtp_port || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = db.get('SELECT id, app_password FROM email_settings ORDER BY updated_at DESC LIMIT 1');
    const now = new Date().toISOString();
    const passwordToSave = app_password || (existing ? existing.app_password : null);

    if (!passwordToSave) {
      return res.status(400).json({ error: 'App password is required' });
    }

    if (existing) {
      db.run(
        'UPDATE email_settings SET smtp_host = ?, smtp_port = ?, email = ?, app_password = ?, updated_at = ? WHERE id = ?',
        [smtp_host, smtp_port, email, passwordToSave, now, existing.id]
      );
    } else {
      db.run(
        'INSERT INTO email_settings (id, smtp_host, smtp_port, email, app_password, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [randomUUID(), smtp_host, smtp_port, email, passwordToSave, now]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update email settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Delete email settings (admin only) ────────────────────────────────────────

router.delete('/', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.run('DELETE FROM email_settings');
    res.json({ success: true });
  } catch (err) {
    console.error('Delete email settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Test email connection (admin only) ────────────────────────────────────────

router.post('/test', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { smtp_host, smtp_port, email, app_password } = req.body;
    
    // If password is not provided, try to get it from DB
    let passwordToTest = app_password;
    if (!passwordToTest) {
      const existing = db.get('SELECT app_password FROM email_settings ORDER BY updated_at DESC LIMIT 1');
      if (existing) passwordToTest = existing.app_password;
    }

    if (!smtp_host || !smtp_port || !email || !passwordToTest) {
      return res.status(400).json({ error: 'Missing configuration for test' });
    }

    const result = await testConnection({
      smtp_host,
      smtp_port,
      email,
      app_password: passwordToTest
    });

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    console.error('Test email connection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
