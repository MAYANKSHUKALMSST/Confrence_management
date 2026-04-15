import { NodeSSH } from 'node-ssh';
import path from 'path';
import 'dotenv/config';

const ssh = new NodeSSH();

// Get configuration from .env
const PRIMARY_IP = '10.30.71.50';
const BACKUP_IP = '10.30.71.51'; // Set to a potential backup IP
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

if (!SSH_PASSWORD) {
  console.error('❌ Error: SSH_PASSWORD not set in .env');
  process.exit(1);
}

async function deployToBackupViaJump() {
  try {
    console.log(`🔗 Connecting to Primary (${PRIMARY_IP}) as jump host...`);
    await ssh.connect({
      host: PRIMARY_IP,
      username: SSH_USER,
      password: SSH_PASSWORD,
      port: 22
    });

    const localTar = path.resolve(process.cwd(), 'roombook.tar');
    const remoteTar = '/tmp/roombook.tar';

    console.log('📤 Uploading roombook.tar to Primary...');
    await ssh.putFile(localTar, remoteTar);

    console.log(`📤 Transferring roombook.tar from Primary to Backup (${BACKUP_IP})...`);
    // Use sshpass to transfer from Primary to Backup
    const transferCmd = `sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no ${remoteTar} ${SSH_USER}@${BACKUP_IP}:${remoteTar}`;
    const transferRes = await ssh.execCommand(transferCmd);
    if (transferRes.code !== 0) {
      throw new Error(`Transfer failed: ${transferRes.stderr}`);
    }

    console.log('📦 Extracting and Setting up environment on Backup...');
    const setupCmd = `sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SSH_USER}@${BACKUP_IP} '
      mkdir -p ~/roombook && 
      cd ~/roombook && 
      tar -xf ${remoteTar} && 
      npm install --production &&
      # Copy production env if exists or set defaults
      echo "SERVER_ROLE=backup" > .env &&
      echo "PEER_SERVER_URL=http://${PRIMARY_IP}" >> .env &&
      echo "PORT=3001" >> .env &&
      # Trigger pm2
      pm2 restart roombook || pm2 start server/index.js --name "roombook"
    '`;

    const setupRes = await ssh.execCommand(setupCmd);
    console.log(setupRes.stdout);
    if (setupRes.stderr) console.log('STDERR:\n', setupRes.stderr);

    console.log('✅ Backup Server deployment complete via Jump Host!');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Deployment failed:', e.message);
    process.exit(1);
  }
}

deployToBackupViaJump();
