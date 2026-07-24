import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.77', username: 'pocbackup', password: '9044472544' });
    console.log('=== BACKUP BOOKINGS TABLE SCHEMA ===');
    const res = await ssh.execCommand(
      `node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');console.log(db.prepare('PRAGMA table_info(bookings)').all())"`,
      { cwd: '/home/pocbackup/roombook' }
    );
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
main();
