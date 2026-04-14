import Database from 'better-sqlite3';
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

const db = new Database(DB_PATH);
console.log('🗄️ SQLite DB initialized at', DB_PATH);

// No periodic save needed; better-sqlite3 writes directly to file


// ── Create tables ──────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL DEFAULT 'Technical',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    avatar_url TEXT DEFAULT ''
  )
`);

db.exec(`
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
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    recurrence_id TEXT,
    recurrence_rule TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    booking_id TEXT,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS email_settings (
    id TEXT PRIMARY KEY,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    email TEXT NOT NULL,
    app_password TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 10,
    equipment TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// ── Indexes for performance ────────────────────────────────────────────────
db.exec('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time)');
db.exec('CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room)');
db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

// ── Wrapper helpers to match better-sqlite3-like API ───────────────────────

const dbHelper = {
  // Run a query that modifies data (INSERT, UPDATE, DELETE)
  run(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.run(params);
  },

  // Get a single row
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    const row = stmt.get(params);
    return row || undefined;
  },

  // Get all rows
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    const rows = stmt.all(params);
    return rows;
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

// ── Seed initial rooms ──────────────────────────────────────────────────────

const existingRooms = dbHelper.all('SELECT name FROM rooms');
if (existingRooms.length === 0) {
  const rooms = [
    { name: 'Liberty', capacity: 20, equipment: 'Projector, Whiteboard, Video Conference Kit, AC', image_url: '/liberty_room.png' },
    { name: 'Unity', capacity: 12, equipment: 'Whiteboard, Large Monitor, AC', image_url: '/unity_room.png' },
    { name: 'Banyan', capacity: 6, equipment: 'Small Monitor, AC', image_url: '/banyan_room.png' }
  ];

  rooms.forEach(r => {
    dbHelper.run(
      'INSERT INTO rooms (id, name, capacity, equipment, image_url) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), r.name, r.capacity, r.equipment, r.image_url]
    );
  });
  console.log('✅ Initial rooms seeded.');
}



export default dbHelper;
