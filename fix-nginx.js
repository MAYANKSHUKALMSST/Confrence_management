import { NodeSSH } from 'node-ssh';
import path from 'path';

const ssh = new NodeSSH();

async function fixNginx() {
  try {
    console.log('Connecting...');
    await ssh.connect({ host: '172.16.100.24', username: 'mayank', password: '9044472544', port: 22 });
    
    console.log('Uploading nginx.conf...');
    await ssh.putFile(
      path.resolve(process.cwd(), 'nginx.conf'),
      '/tmp/nginx.conf'
    );

    console.log('Applying Config...');
    const commands = `
      echo "9044472544" | sudo -S cp /tmp/nginx.conf /etc/nginx/sites-available/roombook
      echo "9044472544" | sudo -S systemctl reload nginx || echo "9044472544" | sudo -S systemctl restart nginx
      echo "9044472544" | sudo -S systemctl status nginx --no-pager
    `;

    const res = await ssh.execCommand(commands);
    console.log(res.stdout);
    if(res.stderr) console.error('ERR:', res.stderr);

    ssh.dispose();
  } catch (err) {
    console.error('Failed:', err);
  }
}

fixNginx();
