import { NodeSSH } from 'node-ssh';
import path from 'path';

const ssh = new NodeSSH();
const SSH_HOST = '10.30.80.77';
const SSH_USER = 'pocbackup';
const SSH_PASSWORD = '9044472544';

async function pushChanges() {
  try {
    console.log(`🔗 Connecting to Backup Server ${SSH_HOST}...`);
    await ssh.connect({
      host: SSH_HOST,
      username: SSH_USER,
      password: SSH_PASSWORD,
      port: 22
    });

    const localServer = path.resolve(process.cwd(), 'server');
    const localDist = path.resolve(process.cwd(), 'dist');
    const remoteServer = `/home/${SSH_USER}/roombook/server`;
    const remoteDist = `/home/${SSH_USER}/roombook/dist`;
    const remoteDir = `/home/${SSH_USER}/roombook`;

    // Create directories
    console.log('📁 Preparing directories...');
    await ssh.execCommand(`mkdir -p ${remoteDir}/server ${remoteDir}/dist`);

    console.log('📤 Uploading server folder...');
    await ssh.putDirectory(localServer, remoteServer, {
      recursive: true,
      concurrency: 5
    });

    console.log('📤 Uploading dist folder...');
    await ssh.putDirectory(localDist, remoteDist, {
      recursive: true,
      concurrency: 5
    });

    const localPkg = path.resolve(process.cwd(), 'package.json');
    console.log('📤 Uploading package.json...');
    await ssh.putFile(localPkg, `${remoteDir}/package.json`);

    const localNginx = path.resolve(process.cwd(), 'nginx.conf');
    const remoteTmpNginx = '/tmp/nginx.conf';

    console.log('📤 Uploading nginx.conf...');
    await ssh.putFile(localNginx, remoteTmpNginx);

    console.log('⚙️  Applying nginx.conf and restarting nginx...');
    const resultCp = await ssh.execCommand(`echo "${SSH_PASSWORD}" | sudo -S cp ${remoteTmpNginx} /etc/nginx/sites-available/default`);
    if(resultCp.stderr && !resultCp.stderr.includes('password')) console.log('Nginx cp:', resultCp.stderr);

    const resultRestart = await ssh.execCommand(`echo "${SSH_PASSWORD}" | sudo -S systemctl restart nginx`);
    if(resultRestart.stderr && !resultRestart.stderr.includes('password')) console.log('Nginx restart:', resultRestart.stderr);

    console.log('🔄 Configuring .env for Backup...');
    // Setting up the backup server .env configuration
    const envCmd = `
      echo "SERVER_ROLE=backup" > .env &&
      echo "PEER_SERVER_URL=http://10.30.80.148" >> .env &&
      echo "PORT=3001" >> .env &&
      echo "JWT_SECRET=your_jwt_secret_here" >> .env &&
      echo "SYNC_SECRET=your_secure_sync_secret_here" >> .env &&
      echo "SYNC_INTERVAL_MS=5000" >> .env
    `;
    await ssh.execCommand(envCmd, { cwd: remoteDir });

    console.log('📦 Installing npm dependencies...');
    await ssh.execCommand(`export PATH=$PATH:/usr/local/bin:/usr/bin:/home/pocbackup/.nvm/versions/node/v20*/bin && npm install --production`, { cwd: remoteDir });

    console.log('🔄 Restarting backend using pm2...');
    const pm2Cmd = `export PATH=$PATH:/usr/local/bin:/usr/bin:/home/pocbackup/.nvm/versions/node/v20*/bin && pm2 restart roombook || pm2 start server/index.js --name "roombook"`;
    await ssh.execCommand(pm2Cmd, { cwd: remoteDir });

    console.log('✅ Backup Deployment complete.');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

pushChanges();
