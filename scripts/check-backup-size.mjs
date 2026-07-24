import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.77', username: 'pocbackup', password: '9044472544' });
    console.log('=== BACKUP DB FILE SIZE ===');
    const res = await ssh.execCommand('ls -lh /home/pocbackup/roombook/server/data/roombook.db');
    console.log(res.stdout || 'Not found');
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
