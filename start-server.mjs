import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function start() {
  try {
    await ssh.connect({ host: '10.30.80.77', username: 'pocbackup', password: '9044472544' });
    console.log('Connected to Backup Server.');

    console.log('\n--- Stopping crashing process ---');
    await ssh.execCommand('pm2 delete roombook');

    console.log('\n--- Starting Node Server Directly ---');
    // Bypassing npm run build because it fails with 'vite: not found'
    const res = await ssh.execCommand('pm2 start server/index.js --name "roombook"', { cwd: '/home/pocbackup/roombook' });
    console.log(res.stdout);
    if(res.stderr) console.log(res.stderr);

    console.log('\n--- Saving PM2 list ---');
    await ssh.execCommand('pm2 save');

    process.exit(0);
  } catch (err) {
    console.error('Error starting:', err);
    process.exit(1);
  }
}

start();
