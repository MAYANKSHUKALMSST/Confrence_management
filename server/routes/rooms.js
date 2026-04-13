import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ── List rooms ─────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  try {
    const rooms = db.all('SELECT * FROM rooms ORDER BY name ASC');
    res.json(rooms);
  } catch (err) {
    console.error('List rooms error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Add room (admin only) ──────────────────────────────────────────────────

router.post('/', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, capacity, equipment, image_url } = req.body;
    if (!name || !capacity) {
      return res.status(400).json({ error: 'Name and capacity are required' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    
    db.run(
      'INSERT INTO rooms (id, name, capacity, equipment, image_url, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, capacity, equipment || '', image_url || '', now]
    );

    const room = db.get('SELECT * FROM rooms WHERE id = ?', [id]);
    res.json(room);
  } catch (err) {
    console.error('Add room error:', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Room name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update room (admin only) ───────────────────────────────────────────────

router.put('/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, capacity, equipment, image_url } = req.body;
    const now = new Date().toISOString();

    db.run(
      'UPDATE rooms SET name = ?, capacity = ?, equipment = ?, image_url = ?, updated_at = ? WHERE id = ?',
      [name, capacity, equipment || '', image_url || '', now, req.params.id]
    );

    const room = db.get('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    res.json(room);
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Delete room (admin only) ───────────────────────────────────────────────

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.run('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
