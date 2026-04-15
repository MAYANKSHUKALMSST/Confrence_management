import { NodeSSH } from 'node-ssh';
import path from 'path';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '10.30.71.50';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function pushDist() {
  try {
    console.log(`🔗 Connecting to ${SSH_HOST}...`);
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });

    const localDist = path.resolve(process.cwd(), 'dist');
    const remoteDist = '/home/mayank/roombook/dist';

    console.log('📤 Uploading dist folder...');
    await ssh.putDirectory(localDist, remoteDist, {
      recursive: true,
      concurrency: 5
    });

    console.log('🔄 Restarting application...');
    await ssh.execCommand('pm2 restart roombook || pm2 start server/index.js --name "roombook"', { cwd: '/home/mayank/roombook' });

    console.log('✅ UI deployment complete!');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Deployment failed:', e.message);
  }
}

pushDist();
