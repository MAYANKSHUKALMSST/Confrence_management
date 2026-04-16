import { NodeSSH } from 'node-ssh';
import path from 'path';

const ssh = new NodeSSH();
const SSH_HOST = '172.16.100.138';
const SSH_USER = 'mayank';
const SSH_PASSWORD = '9044472544';

async function pushChanges() {
  try {
    console.log(`🔗 Connecting to ${SSH_HOST}...`);
    await ssh.connect({
      host: SSH_HOST,
      username: SSH_USER,
      password: SSH_PASSWORD,
      port: 22
    });

    const localServer = path.resolve(process.cwd(), 'server');
    const remoteServer = '/home/mayank/roombook/server';

    console.log('📤 Uploading server folder...');
    await ssh.putDirectory(localServer, remoteServer, {
      recursive: true,
      concurrency: 5
    });

    const localNginx = path.resolve(process.cwd(), 'nginx.conf');
    const remoteTmpNginx = '/tmp/nginx.conf';

    console.log('📤 Uploading nginx.conf...');
    await ssh.putFile(localNginx, remoteTmpNginx);

    console.log('⚙️  Applying nginx.conf and restarting...');
    const resultCp = await ssh.execCommand(`echo "${SSH_PASSWORD}" | sudo -S cp ${remoteTmpNginx} /etc/nginx/sites-available/default`);
    if(resultCp.stderr && !resultCp.stderr.includes('password')) console.log('Nginx cp:', resultCp.stderr);

    const resultRestart = await ssh.execCommand(`echo "${SSH_PASSWORD}" | sudo -S systemctl restart nginx`);
    if(resultRestart.stderr && !resultRestart.stderr.includes('password')) console.log('Nginx restart:', resultRestart.stderr);

    console.log('🔄 Restarting backend using pm2...');
    await ssh.execCommand('pm2 restart roombook || pm2 start server/index.js --name "roombook"', { cwd: '/home/mayank/roombook' });

    console.log('✅ Deployment complete.');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

pushChanges();
