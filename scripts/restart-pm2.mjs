import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('🔄 Restarting roombook to clear rate limits...');
    await ssh.execCommand('pm2 restart roombook');
    console.log('✅ Restarted.');
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
main();
