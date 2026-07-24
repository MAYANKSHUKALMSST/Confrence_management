import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== EMAIL SETTINGS ===');
    const res = await ssh.execCommand(
      `node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');console.log(db.prepare('SELECT email, smtp_host FROM email_settings').all())"`,
      { cwd: '/home/mayank/roombook' }
    );
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
main();
