import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'roombook.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── Initialize sql.js and load/create database ─────────────────────────────

const SQL = await initSqlJs();

let db;
if (fs.existsSync(DB_PATH)) {
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
  console.log('📂 Loaded existing database from', DB_PATH);
} else {
  db = new SQL.Database();
  console.log('🆕 Created new database');
}

// ── Save helper ────────────────────────────────────────────────────────────

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Auto-save every 5 seconds
setInterval(saveDb, 5000);

// Save on process exit
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(0); });
process.on('SIGTERM', () => { saveDb(); process.exit(0); });

// ── Create tables ──────────────────────────────────────────────────────────

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL DEFAULT 'Technical',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    room TEXT NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    attendees TEXT NOT NULL DEFAULT '',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    booking_id TEXT,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// ── Wrapper helpers to match better-sqlite3-like API ───────────────────────

const dbHelper = {
  // Run a query that modifies data (INSERT, UPDATE, DELETE)
  run(sql, params = []) {
    db.run(sql, params);
    saveDb();
  },

  // Get a single row
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  },

  // Get all rows
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },
};

// ── Seed admin account ─────────────────────────────────────────────────────

const existingAdmin = dbHelper.get('SELECT id FROM users WHERE email = ?', ['admin']);
if (!existingAdmin) {
  const adminId = randomUUID();
  const hash = bcrypt.hashSync('Admin@245', 10);
  dbHelper.run(
    'INSERT INTO users (id, email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, ?, ?)',
    [adminId, 'admin', hash, 'Administrator', 'Admin', 'admin']
  );
  console.log('✅ Admin account seeded (email: admin, password: Admin@245)');
}

saveDb();

export default dbHelper;
