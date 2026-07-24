import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: '9044472544' });
    console.log('=== SEARCHING FOR DB FILES ===');
    const res = await ssh.execCommand('find /home/mayank/roombook -name "*.db"');
    console.log(res.stdout);
    
    console.log('\n=== DB FILE SIZES ===');
    const sizeRes = await ssh.execCommand('ls -lh /home/mayank/roombook/server/data/roombook.db');
    console.log(sizeRes.stdout);

    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
