import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== PM2 STATUS ===');
    const status = await ssh.execCommand('pm2 list');
    console.log(status.stdout);

    console.log('\n=== LAST 60 LOG LINES ===');
    const logs = await ssh.execCommand('pm2 logs roombook --lines 60 --nostream');
    console.log(logs.stdout);
    if (logs.stderr) console.log(logs.stderr);

    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
