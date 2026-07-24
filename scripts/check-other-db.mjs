import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    
    console.log('=== CHECKING /home/mayank/server/data/roombook.db ===');
    const res = await ssh.execCommand(
      `node -e "const D=require('better-sqlite3');try{const db=new D('server/data/roombook.db');const u=db.prepare('SELECT id,email,full_name,role FROM users').all();console.log(JSON.stringify(u,null,2));db.close();}catch(e){console.log('Error:',e.message);}"`,
      { cwd: '/home/mayank' }
    );
    console.log(res.stdout || res.stderr);

    ssh.dispose();
  } catch (e) {
    console.error('Error:', e.message);
  }
}
main();
