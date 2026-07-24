import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware to ensure admin role
const ensureAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(authenticateToken);
router.use(ensureAdmin);

// ── Download Database Backup ────────────────────────────────────────────────
router.get('/backup/download', (req, res) => {
  try {
    const dbFilePath = path.join(__dirname, '..', 'data', 'roombook.db');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const downloadName = `roombook_backup_${timestamp}.db`;

    // We can't use .backup here easily without spawning a process, 
    // but since this is for manual download, we'll just send the file.
    // SQLite can handle reads while writing usually, but for a clean backup 
    // it's better to copy it first.
    
    const tempBackupPath = path.join(__dirname, '..', 'data', `temp_${downloadName}`);
    
    // Using a simple command to copy ensures we don't lock node
    import('child_process').then(({ exec }) => {
      exec(`sqlite3 "${dbFilePath}" ".backup '${tempBackupPath}'"`, (err) => {
        if (err) {
          console.error('Backup creation error:', err);
          return res.status(500).json({ error: 'Failed to create backup file' });
        }

        res.download(tempBackupPath, downloadName, (downloadErr) => {
          // Cleanup temp file after download
          if (fs.existsSync(tempBackupPath)) {
            fs.unlinkSync(tempBackupPath);
          }
        });
      });
    });

  } catch (err) {
    console.error('Backup route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get System Status ───────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  try {
    const stats = {
      userCount: db.get('SELECT COUNT(*) as count FROM users').count,
      bookingCount: db.get('SELECT COUNT(*) as count FROM bookings').count,
      roomCount: db.get('SELECT COUNT(*) as count FROM rooms').count,
      dbSize: fs.statSync(path.join(__dirname, '..', 'data', 'roombook.db')).size,
      uptime: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
