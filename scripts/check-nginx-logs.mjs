import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== NGINX ERROR LOGS ===');
    const res = await ssh.execCommand('echo "9044472544" | sudo -S tail -n 50 /var/log/nginx/error.log');
    console.log(res.stdout);
    if (!res.stdout.trim()) {
       console.log('No recent nginx errors.');
    }
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
