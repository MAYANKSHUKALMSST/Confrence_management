import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    // We might need to jump through primary if backup is not directly accessible, but let's try direct first.
    console.log('🔗 Connecting to Backup (10.30.80.77)...');
    await ssh.connect({ host: '10.30.80.77', username: 'pocbackup', password: '9044472544' });
    
    console.log('\n📋 Listing all users in Backup DB...');
    const listRes = await ssh.execCommand(
      `node -e "const D=require('better-sqlite3');const db=new D('roombook/server/data/roombook.db');const u=db.prepare('SELECT id,email,full_name,role FROM users').all();console.log(JSON.stringify(u,null,2));db.close();"`,
      { cwd: '/home/pocbackup' }
    );
    console.log(listRes.stdout || listRes.stderr);

    ssh.dispose();
  } catch (e) {
    console.error('❌ Direct connection failed:', e.message);
    console.log('Trying via Jump Host...');
    // Add jump host logic if needed
  }
}
run();
