import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function check() {
  try {
    await ssh.connect({ host: '10.30.80.77', username: 'pocbackup', password: '9044472544' });
    console.log('Connected to Backup Server.');

    console.log('\n--- PM2 Logs ---');
    let res = await ssh.execCommand('pm2 logs roombook --lines 50 --nostream');
    console.log(res.stdout);
    if(res.stderr) console.log(res.stderr);

    process.exit(0);
  } catch (err) {
    console.error('Error connecting:', err);
    process.exit(1);
  }
}

check();
