import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== BOOKINGS TABLE SCHEMA ===');
    const res = await ssh.execCommand('sqlite3 server/data/roombook.db ".schema bookings"', { cwd: '/home/mayank/roombook' });
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
main();
