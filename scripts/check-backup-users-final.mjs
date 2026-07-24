import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.77', username: 'pocbackup', password: '9044472544' });
    console.log('=== CHECKING USERS ON BACKUP SERVER ===');
    const res = await ssh.execCommand(
      `node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');const u=db.prepare('SELECT id,email,full_name,role FROM users').all();console.log(JSON.stringify(u,null,2));db.close();"`,
      { cwd: '/home/pocbackup/roombook' }
    );
    console.log(res.stdout || res.stderr);
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
