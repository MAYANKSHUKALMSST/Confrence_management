import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== NGINX SIGNIN REQUESTS ===');
    const res = await ssh.execCommand('grep "/api/auth/signin" /var/log/nginx/access.log | tail -n 20');
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
main();
