import { NodeSSH } from 'node-ssh';
import bcrypt from 'bcryptjs';

const ssh = new NodeSSH();
const SSH_HOST = '10.30.80.77'; // Backup Server
const SSH_USER = 'pocbackup';
const SSH_PASSWORD = '9044472544';

async function main() {
  try {
    console.log(`🔗 Connecting to Backup Server (${SSH_HOST})...`);
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });

    const newHash = bcrypt.hashSync('Admin@245#', 10);
    console.log('\n🔑 Resetting admin password on backup server...');
    // We pass the hash via environment variable to avoid shell escaping issues with $ characters
    const resetRes = await ssh.execCommand(
      `export NEW_HASH='${newHash}'; node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');const r=db.prepare('UPDATE users SET password_hash=? WHERE email=?').run(process.env.NEW_HASH,'admin');console.log('Rows updated:',r.changes);db.close();"`,
      { cwd: '/home/pocbackup/roombook' }
    );
    console.log(resetRes.stdout || resetRes.stderr);

    console.log('\n✅ Done.');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

main();
