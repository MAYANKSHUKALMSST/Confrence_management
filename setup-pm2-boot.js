import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  try {
    console.log('🔗 Connecting to server...');
    await ssh.connect({
      host: '172.16.100.24',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });
    console.log('✅ Connected.');

    const command = `
      echo "Generating PM2 Startup Script..."
      # This runs the built-in pm2 command to generate and execute the systemd startup script
      echo "9044472544" | sudo -S env PATH=$PATH:/usr/bin pm2 startup systemd -u mayank --hp /home/mayank
      pm2 save
      
      echo "Ensuring NGINX is enabled on boot..."
      echo "9044472544" | sudo -S systemctl enable nginx
    `;

    const result = await ssh.execCommand(command);
    console.log('STDOUT:', result.stdout);
    if (result.stderr) console.error('STDERR:', result.stderr);

    console.log('✅ PM2 configured to start on boot.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    ssh.dispose();
  }
}

run();
