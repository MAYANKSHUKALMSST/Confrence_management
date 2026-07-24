import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== SEARCHING FOR ANY SQLITE FILES ON ENTIRE HOME ===');
    const res = await ssh.execCommand('find /home/mayank -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3"');
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
