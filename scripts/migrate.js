import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_PASSWORD = process.env.SSH_PASSWORD;

if (!SSH_PASSWORD) {
  console.error('❌ Error: SSH_PASSWORD not set in .env');
  process.exit(1);
}

async function migrateDbOnBoth() {
  try {
    const servers = [
      { host: '10.30.71.50', name: 'Primary' }
    ];

    for (const server of servers) {
      console.log(`🗄️  Migrating database on ${server.name}...`);
      
      await ssh.connect({ host: server.host, username: 'mayank', password: SSH_PASSWORD });
      
      await ssh.execCommand('sqlite3 ~/roombook/server/data/roombook.db "ALTER TABLE bookings ADD COLUMN recurrence_id TEXT;"');
      await ssh.execCommand('sqlite3 ~/roombook/server/data/roombook.db "ALTER TABLE bookings ADD COLUMN recurrence_rule TEXT;"');
      
      console.log(`✅ ${server.name} migrated.`);
      ssh.dispose();
    }

  } catch (e) {
    console.warn('⚠️ Migration notice (column might already exist):', e.message);
  }
}

migrateDbOnBoth();
