import { NodeSSH } from 'node-ssh';
import path from 'path';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '172.16.100.138';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function pushNginxConfig() {
  try {
    console.log(`🔗 Connecting to ${SSH_HOST}...`);
    await ssh.connect({
      host: SSH_HOST,
      username: SSH_USER,
      password: SSH_PASSWORD
    });

    const localConfig = path.resolve(process.cwd(), 'nginx.conf');
    const remoteTmpConfig = '/tmp/nginx.conf';

    console.log('📤 Uploading nginx.conf...');
    await ssh.putFile(localConfig, remoteTmpConfig);

    console.log('⚙️  Applying nginx.conf and restarting...');
    // Replace the default config and restart. Adjust path if necessary.
    await ssh.execCommand(`echo "${SSH_PASSWORD}" | sudo -S cp ${remoteTmpConfig} /etc/nginx/sites-available/default`);
    await ssh.execCommand(`echo "${SSH_PASSWORD}" | sudo -S systemctl restart nginx`);

    console.log('✅ Nginx configuration updated and service restarted.');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

pushNginxConfig();
