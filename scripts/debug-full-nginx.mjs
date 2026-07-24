import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const PRIMARY_IP = '10.30.80.148';

async function main() {
  try {
    await ssh.connect({
      host: PRIMARY_IP,
      username: 'mayank',
      password: '9044472544'
    });

    console.log('📄 Reading full Nginx config...');
    const res = await ssh.execCommand("echo '9044472544' | sudo -S cat /etc/nginx/sites-available/roombook");
    console.log(res.stdout);

    ssh.dispose();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

main();
