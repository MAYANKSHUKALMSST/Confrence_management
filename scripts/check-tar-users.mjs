import Database from 'better-sqlite3';
const db = new Database('./temp_extract/server/data/roombook.db');
const users = db.prepare('SELECT id, email, full_name, role FROM users').all();
console.log('=== USERS IN TAR ARCHIVE ===');
console.log(JSON.stringify(users, null, 2));
db.close();
