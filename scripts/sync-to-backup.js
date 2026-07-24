import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const PRIMARY_IP = '10.30.80.148';
const BACKUP_IP = '10.30.80.77';
const PRIMARY_USER = 'mayank';
const BACKUP_USER = 'pocbackup';
const SSH_PASSWORD = process.env.SSH_PASSWORD || '9044472544';
const BACKUP_PASSWORD = '9044472544';

async function syncToBackup() {
  try {
    console.log(`🔗 Connecting to Primary (${PRIMARY_IP}) as jump host...`);
    await ssh.connect({
      host: PRIMARY_IP,
      username: PRIMARY_USER,
      password: SSH_PASSWORD
    });

    console.log(`📤 Transferring dist/ and server/ to Backup (${BACKUP_IP})...`);
    // Copy dist folder
    const distCmd = `sshpass -p "${BACKUP_PASSWORD}" scp -o StrictHostKeyChecking=no -r ~/roombook/dist ${BACKUP_USER}@${BACKUP_IP}:~/roombook/`;
    const r1 = await ssh.execCommand(distCmd);
    if(r1.stderr && !r1.stderr.includes('password')) console.log('dist error:', r1.stderr);

    // Copy server folder
    const serverCmd = `sshpass -p "${BACKUP_PASSWORD}" scp -o StrictHostKeyChecking=no -r ~/roombook/server ${BACKUP_USER}@${BACKUP_IP}:~/roombook/`;
    const r2 = await ssh.execCommand(serverCmd);
    if(r2.stderr && !r2.stderr.includes('password')) console.log('server error:', r2.stderr);

    // Copy nginx configuration
    const nginxCmd = `sshpass -p "${BACKUP_PASSWORD}" scp -o StrictHostKeyChecking=no /etc/nginx/sites-available/default ${BACKUP_USER}@${BACKUP_IP}:/tmp/nginx.conf`;
    await ssh.execCommand(nginxCmd);

    // Ensure the backend restarts on the backup server
    console.log(`🔄 Restarting services on Backup...`);
    const setupCmd = `sshpass -p "${BACKUP_PASSWORD}" ssh -o StrictHostKeyChecking=no ${BACKUP_USER}@${BACKUP_IP} '
      echo "${BACKUP_PASSWORD}" | sudo -S cp /tmp/nginx.conf /etc/nginx/sites-available/default &&
      echo "${BACKUP_PASSWORD}" | sudo -S systemctl restart nginx &&
      export PATH=$PATH:/usr/local/bin:/usr/bin:/home/pocbackup/.nvm/versions/node/v20*/bin &&
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
