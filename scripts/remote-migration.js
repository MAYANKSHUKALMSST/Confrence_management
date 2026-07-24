import { NodeSSH } from 'node-ssh';
import path from 'path';
const ssh = new NodeSSH();

const script = `
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
`;

async function run() {
  try {
    const fs = await import('fs');
    const localMigratePath = path.resolve('scripts/temp-migrate.mjs');
    fs.writeFileSync(localMigratePath, script);

    await ssh.connect({host: '10.30.71.50', username: 'mayank', password: '9044472544'});
    await ssh.putFile(localMigratePath, '/home/mayank/roombook/temp-migrate.mjs');
    
    // We must run it using npm run / node from the project directory so better-sqlite3 loads
    const res = await ssh.execCommand('/usr/bin/env node temp-migrate.mjs', { cwd: '/home/mayank/roombook' });
    console.log('STDOUT:', res.stdout);
    console.log('STDERR:', res.stderr);
    
    await ssh.execCommand('pm2 restart roombook');
    console.log('✅ Remote migration executed via Node.');
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
run();
