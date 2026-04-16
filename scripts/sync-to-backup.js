import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const PRIMARY_IP = '10.30.71.50';
const BACKUP_IP = '10.30.71.51';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD || '9044472544';

async function syncToBackup() {
  try {
    console.log(`🔗 Connecting to Primary (${PRIMARY_IP}) as jump host...`);
    await ssh.connect({
      host: PRIMARY_IP,
      username: SSH_USER,
      password: SSH_PASSWORD
    });

    console.log(`📤 Transferring dist/ and server/ to Backup (${BACKUP_IP})...`);
    // Copy dist folder
    const distCmd = `sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -r ~/roombook/dist ${SSH_USER}@${BACKUP_IP}:~/roombook/`;
    const r1 = await ssh.execCommand(distCmd);
    if(r1.stderr && !r1.stderr.includes('password')) console.log('dist error:', r1.stderr);

    // Copy server folder
    const serverCmd = `sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no -r ~/roombook/server ${SSH_USER}@${BACKUP_IP}:~/roombook/`;
    const r2 = await ssh.execCommand(serverCmd);
    if(r2.stderr && !r2.stderr.includes('password')) console.log('server error:', r2.stderr);

    // Copy nginx configuration
    const nginxCmd = `sshpass -p "${SSH_PASSWORD}" scp -o StrictHostKeyChecking=no /etc/nginx/sites-available/default ${SSH_USER}@${BACKUP_IP}:/tmp/nginx.conf`;
    await ssh.execCommand(nginxCmd);

    // Ensure the backend restarts on the backup server
    console.log(`🔄 Restarting services on Backup...`);
    const setupCmd = `sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SSH_USER}@${BACKUP_IP} '
      echo "${SSH_PASSWORD}" | sudo -S cp /tmp/nginx.conf /etc/nginx/sites-available/default &&
      echo "${SSH_PASSWORD}" | sudo -S systemctl restart nginx &&
      pm2 restart roombook || pm2 start server/index.js --name "roombook"
    '`;
    const r3 = await ssh.execCommand(setupCmd);
    if(r3.stderr && !r3.stderr.includes('password')) console.log('restart error:', r3.stderr);

    console.log('✅ Changes synced to backup server!');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

syncToBackup();
