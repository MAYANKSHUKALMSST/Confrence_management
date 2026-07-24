import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '10.30.80.77', username: 'pocbackup', password: '9044472544' });
    console.log('🔗 Creating backup directory on backup server...');
    await ssh.execCommand('mkdir -p ~/roombook/backups', { cwd: '/home/pocbackup' });
    console.log('✅ Directory ~/roombook/backups created.');
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
