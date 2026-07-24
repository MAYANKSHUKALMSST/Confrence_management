import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    
    console.log('=== CHECKING BOOKINGS IN DB ===');
    const res = await ssh.execCommand(
      `node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');const b=db.prepare('SELECT * FROM bookings').all();console.log(JSON.stringify(b,null,2));db.close();"`,
      { cwd: '/home/mayank/roombook' }
    );
    console.log(res.stdout || res.stderr);

    ssh.dispose();
  } catch (e) {
    console.error('Error:', e.message);
  }
}
main();
