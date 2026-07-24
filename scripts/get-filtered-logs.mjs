import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function main() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== FILTERED PM2 LOGS ===');
    const res = await ssh.execCommand('pm2 logs roombook --lines 200 --nostream | grep -v "Sync to peer"');
    console.log(res.stdout);
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
main();
