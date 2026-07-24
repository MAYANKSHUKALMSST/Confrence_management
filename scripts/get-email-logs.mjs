import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== EMAIL LOGS ===');
    const res = await ssh.execCommand('grep "Email" /home/mayank/.pm2/logs/roombook-out.log | tail -n 20');
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
main();
