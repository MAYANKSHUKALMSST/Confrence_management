
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('/home/mayank/roombook/server/data/roombook.db');
const db = new Database(dbPath);
console.log('Opened DB at', dbPath);

try {
  db.exec('ALTER TABLE bookings ADD COLUMN recurrence_id TEXT;');
  console.log('Added recurrence_id');
} catch (e) {
  console.log('recurrence_id error/exists:', e.message);
}

try {
  db.exec('ALTER TABLE bookings ADD COLUMN recurrence_rule TEXT;');
  console.log('Added recurrence_rule');
} catch (e) {
  console.log('recurrence_rule error/exists:', e.message);
}
db.close();
