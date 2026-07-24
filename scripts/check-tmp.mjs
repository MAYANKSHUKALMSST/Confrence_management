import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== SEARCHING IN /tmp ===');
    const res = await ssh.execCommand('ls -R /tmp/roombook*');
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
