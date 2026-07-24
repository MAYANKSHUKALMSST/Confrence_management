import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./server/data/roombook.db');

// List all users
const users = db.prepare('SELECT id, email, full_name, role FROM users').all();
console.log('=== USERS IN DATABASE ===');
console.log(JSON.stringify(users, null, 2));

// Reset admin password
const newPassword = 'Admin@245';
const hash = bcrypt.hashSync(newPassword, 10);
const result = db.prepare("UPDATE users SET password_hash = ? WHERE email = 'admin'").run(hash);
console.log('\n=== PASSWORD RESET ===');
console.log(`Rows updated: ${result.changes}`);
if (result.changes > 0) {
  console.log(`✅ Admin password reset to: ${newPassword}`);
} else {
  console.log('⚠️ No admin user found with email "admin"');
}

db.close();
