import { NodeSSH } from 'node-ssh';
import path from 'path';

const ssh = new NodeSSH();

async function installAndConfigNginx() {
  try {
    console.log('🔗 Connecting to Backup Server (10.30.71.77)...');
    await ssh.connect({
      host: '10.30.71.77',
      username: 'pocbackup',
      password: '9044472544',
      port: 22
    });

    console.log('📦 Installing Nginx...');
    await ssh.execCommand('echo "9044472544" | sudo -S apt-get update && echo "9044472544" | sudo -S apt-get install -y nginx');

    console.log('📤 Uploading nginx.conf...');
    const localNginx = path.resolve(process.cwd(), 'nginx.conf');
    const remoteTmpNginx = '/tmp/nginx.conf';
    await ssh.putFile(localNginx, remoteTmpNginx);

    console.log('⚙️  Applying Nginx configuration...');
    await ssh.execCommand('echo "9044472544" | sudo -S cp /tmp/nginx.conf /etc/nginx/sites-available/default');
    await ssh.execCommand('echo "9044472544" | sudo -S systemctl enable nginx');
    const restartStatus = await ssh.execCommand('echo "9044472544" | sudo -S systemctl restart nginx');
    
    if(restartStatus.stderr && !restartStatus.stderr.includes('password')) {
        console.log('Restart Err:', restartStatus.stderr);
    } else {
        console.log('✅ Nginx installed and running!');
    }

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    ssh.dispose();
  }
}

installAndConfigNginx();
