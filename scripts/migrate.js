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
      { host: '172.16.100.24', name: 'Primary' },
      { host: '172.16.100.25', name: 'Backup' }
    ];

    for (const server of servers) {
      console.log(`🗄️  Migrating database on ${server.name}...`);
      
      if (server.name === 'Backup') {
        const jumpSsh = new NodeSSH();
        await jumpSsh.connect({ host: '172.16.100.24', username: 'mayank', password: SSH_PASSWORD });
        
        const jumpPrefix = `sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no mayank@172.16.100.25`;
        
        // Use sqlite3 command line tool to alter table
        const altCmd1 = `${jumpPrefix} 'sqlite3 ~/roombook/server/data/roombook.db "ALTER TABLE bookings ADD COLUMN recurrence_id TEXT;"'`;
        const altCmd2 = `${jumpPrefix} 'sqlite3 ~/roombook/server/data/roombook.db "ALTER TABLE bookings ADD COLUMN recurrence_rule TEXT;"'`;
        
        await jumpSsh.execCommand(altCmd1);
        await jumpSsh.execCommand(altCmd2);
        
        console.log(`✅ ${server.name} migrated.`);
        jumpSsh.dispose();
      } else {
        await ssh.connect({ host: server.host, username: 'mayank', password: SSH_PASSWORD });
        
        await ssh.execCommand('sqlite3 ~/roombook/server/data/roombook.db "ALTER TABLE bookings ADD COLUMN recurrence_id TEXT;"');
        await ssh.execCommand('sqlite3 ~/roombook/server/data/roombook.db "ALTER TABLE bookings ADD COLUMN recurrence_rule TEXT;"');
        
        console.log(`✅ ${server.name} migrated.`);
        ssh.dispose();
      }
    }

  } catch (e) {
    console.warn('⚠️ Migration notice (column might already exist):', e.message);
  }
}

migrateDbOnBoth();
