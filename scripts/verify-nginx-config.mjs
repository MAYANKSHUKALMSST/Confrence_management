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

    console.log('🧐 Verifying current server_name configuration...');
    const verifyRes = await ssh.execCommand("echo '9044472544' | sudo -S nginx -T | grep 'server_name'");
    console.log(verifyRes.stdout);

    ssh.dispose();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

main();
