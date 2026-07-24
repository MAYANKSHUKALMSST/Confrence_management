import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.77', username: 'pocbackup', password: '9044472544' });
    console.log('=== SEARCHING FOR DB FILES ON BACKUP ===');
    const res = await ssh.execCommand('find /home/pocbackup -name "*.db"');
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
