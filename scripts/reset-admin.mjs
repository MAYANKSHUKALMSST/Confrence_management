import { NodeSSH } from 'node-ssh';
import bcrypt from 'bcryptjs';

const ssh = new NodeSSH();
const SSH_HOST = '10.30.80.148';
const SSH_USER = 'mayank';
const SSH_PASSWORD = '9044472544';

async function main() {
  try {
    console.log(`🔗 Connecting to ${SSH_HOST}...`);
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });

    // 1. List all users
    console.log('\n📋 Listing all users in DB...');
    const listRes = await ssh.execCommand(
      `node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');const u=db.prepare('SELECT id,email,full_name,role FROM users').all();console.log(JSON.stringify(u,null,2));db.close();"`,
      { cwd: '/home/mayank/roombook' }
    );
    console.log(listRes.stdout || listRes.stderr);

    // 2. Reset admin password
    const newHash = bcrypt.hashSync('Admin@245#', 10);
    console.log('\n🔑 Resetting admin password...');
    // We pass the hash via environment variable to avoid shell escaping issues with $ characters
    const resetRes = await ssh.execCommand(
      `export NEW_HASH='${newHash}'; node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');const r=db.prepare('UPDATE users SET password_hash=? WHERE email=?').run(process.env.NEW_HASH,'admin');console.log('Rows updated:',r.changes);db.close();"`,
      { cwd: '/home/mayank/roombook' }
    );
    console.log(resetRes.stdout || resetRes.stderr);

    console.log('\n✅ Done. Admin credentials: email=admin  password=Admin@245#');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

main();
