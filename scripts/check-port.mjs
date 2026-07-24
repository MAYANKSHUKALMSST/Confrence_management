import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== LISTENING PORTS ===');
    const res = await ssh.execCommand('echo "9044472544" | sudo -S netstat -tulpn | grep :3001');
    console.log(res.stdout);
    if (!res.stdout.trim()) {
       console.log('No process listening on port 3001. Backend might be down.');
    }
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
