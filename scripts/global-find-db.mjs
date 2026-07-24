import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== GLOBAL SEARCH FOR roombook.db ===');
    const res = await ssh.execCommand('find / -name "roombook.db" 2>/dev/null');
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
