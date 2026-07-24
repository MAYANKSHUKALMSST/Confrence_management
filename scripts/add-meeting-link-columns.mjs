import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function runMigration() {
  const hosts = ['10.30.80.148', '10.30.80.77'];
  const credentials = {
    '10.30.80.148': { user: 'mayank', password: '9044472544', path: '/home/mayank/roombook' },
    '10.30.80.77': { user: 'pocbackup', password: '9044472544', path: '/home/pocbackup/roombook' }
  };

  for (const host of hosts) {
    try {
      const { user, password, path } = credentials[host];
      console.log(`🔗 Connecting to ${host}...`);
      await ssh.connect({ host, username: user, password });

      console.log(`🛠️  Adding meeting_link and notes columns to ${host}...`);
      
      const commands = [
        'ALTER TABLE bookings ADD COLUMN meeting_link TEXT',
        'ALTER TABLE bookings ADD COLUMN notes TEXT'
      ];

      for (const sql of commands) {
        const jsCmd = `node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');try{db.exec('${sql}');console.log('OK');}catch(e){console.error(e.message);}"`;
        const res = await ssh.execCommand(jsCmd, { cwd: path });
        if (res.stderr && !res.stderr.includes('duplicate column name')) {
          console.error(`❌ Error on ${host}:`, res.stderr);
        } else {
          console.log(`✅ ${host}: ${res.stdout.trim() || 'Already exists'}`);
        }
      }

      ssh.dispose();
    } catch (e) {
      console.error(`❌ Failed to migrate ${host}:`, e.message);
    }
  }
}

runMigration();
