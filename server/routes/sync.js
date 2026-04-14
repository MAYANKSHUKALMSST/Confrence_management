import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import db, { DB_PATH } from '../db.js';

const router = Router();

function getSyncSecret() {
  return process.env.SYNC_SECRET || '';
}

function authenticateSync(req, res, next) {
  const secret = getSyncSecret();
  if (!secret) {
    return res.status(500).json({ error: 'Sync not configured (no SYNC_SECRET)' });
  }
  const provided = req.headers['x-sync-secret'] || req.query.secret;
  if (provided !== secret) {
    return res.status(403).json({ error: 'Invalid sync secret' });
  }
  next();
}

// ── Export DB ───────────────────────────────────────────────────────────────
// Returns the raw SQLite DB file for the peer server to download

router.get('/export', authenticateSync, (req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="roombook.db"');
    const stream = fs.createReadStream(DB_PATH);
    stream.pipe(res);
  } catch (err) {
    console.error('Sync export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ── Import DB ──────────────────────────────────────────────────────────────
// Receives a raw SQLite DB file from the peer and replaces the local one

router.post('/import', authenticateSync, (req, res) => {
  try {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 100) {
          return res.status(400).json({ error: 'Invalid database file (too small)' });
        }

        // Write to a temp file first, then rename (atomic-ish)
        const tmpPath = DB_PATH + '.tmp';
        fs.writeFileSync(tmpPath, buffer);
        
        // Reload the database with the new file
        db.reloadDatabase();
        fs.renameSync(tmpPath, DB_PATH);
        db.reloadDatabase(); // reload again to pick up the renamed file
        
        console.log(`✅ DB imported successfully (${buffer.length} bytes)`);
        res.json({ success: true, size: buffer.length });
      } catch (err) {
        console.error('Sync import write error:', err);
        res.status(500).json({ error: 'Import write failed: ' + err.message });
      }
    });
    req.on('error', (err) => {
      console.error('Sync import stream error:', err);
      res.status(500).json({ error: 'Import stream failed' });
    });
  } catch (err) {
    console.error('Sync import error:', err);
    res.status(500).json({ error: 'Import failed' });
  }
});

// ── Sync push to peer ──────────────────────────────────────────────────────
// Pushes the local DB to the peer server

export async function pushDbToPeer() {
  const peerUrl = process.env.PEER_SERVER_URL;
  const syncSecret = getSyncSecret();
  
  if (!peerUrl || !syncSecret) {
    return;
  }

  try {
    const dbBuffer = fs.readFileSync(DB_PATH);
    const response = await fetch(`${peerUrl}/api/sync/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-sync-secret': syncSecret,
      },
      body: dbBuffer,
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`🔄 DB synced to peer (${result.size} bytes)`);
    } else {
      const err = await response.text();
      console.warn(`⚠️ Sync to peer failed (${response.status}): ${err}`);
    }
  } catch (err) {
    // Peer might be down — this is expected during failover
    console.warn(`⚠️ Sync to peer unreachable: ${err.message}`);
  }
}

// ── Start periodic sync timer ──────────────────────────────────────────────

export function startSyncTimer() {
  const role = process.env.SERVER_ROLE || 'primary';
  const interval = parseInt(process.env.SYNC_INTERVAL_MS || '300000', 10);
  const peerUrl = process.env.PEER_SERVER_URL;
  const syncSecret = getSyncSecret();

  if (!peerUrl || !syncSecret) {
    console.log('ℹ️ Sync not configured (missing PEER_SERVER_URL or SYNC_SECRET)');
    return;
  }

  console.log(`🔄 Sync timer started: role=${role}, interval=${interval / 1000}s, peer=${peerUrl}`);
  
  // Initial sync after 30 seconds
  setTimeout(() => pushDbToPeer(), 30000);
  
  // Periodic sync
  setInterval(() => pushDbToPeer(), interval);
}

// ── Instant Sync Trigger (Debounced) ───────────────────────────────────────
let syncTimeout = null;
const SYNC_DEBOUNCE_MS = 1000; // 1 second debounce

export function triggerInstantSync() {
  if (process.env.SERVER_ROLE !== 'primary') {
    return; // Only primary pushes changes
  }

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    console.log('⚡ Instant sync triggered by data change');
    pushDbToPeer();
    syncTimeout = null;
  }, SYNC_DEBOUNCE_MS);
}

/** Bind the sync trigger to database write events */
export function setupInstantSync(dbHelper) {
  dbHelper.onChange = () => {
    triggerInstantSync();
  };
}

export default router;
