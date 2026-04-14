import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function diagnose() {
  try {
    console.log('🔗 Connecting to server 172.16.100.24...');
    await ssh.connect({
      host: '172.16.100.24',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });
    console.log('✅ Connected.');

    const commands = [
      { name: 'PM2 Status', cmd: 'pm2 status' },
      { name: 'PM2 Error Logs', cmd: 'tail -n 100 ~/.pm2/logs/roombook-error.log' },
      { name: 'Nginx Error Log', cmd: 'echo "9044472544" | sudo -S tail -n 100 /var/log/nginx/error.log' },
      { name: 'Nginx Access Log', cmd: 'echo "9044472544" | sudo -S tail -n 100 /var/log/nginx/access.log' },
      { name: 'Test Nginx Public /', cmd: 'curl -i http://172.16.100.24/' },
      { name: 'Test Nginx Public /auth', cmd: 'curl -i http://172.16.100.24/auth' },
      { name: 'Test Backend /api/rooms', cmd: 'curl -i http://localhost:3001/api/rooms' }
    ];

    for (const item of commands) {
      console.log(`\n--- ${item.name} ---`);
      const result = await ssh.execCommand(item.cmd);
      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.error('STDERR:', result.stderr);
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  } finally {
    ssh.dispose();
  }
}

diagnose();
