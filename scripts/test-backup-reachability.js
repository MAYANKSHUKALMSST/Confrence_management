import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function testConnection() {
  try {
    console.log('Connecting to Backup Server (10.30.71.77) via Laptop...');
    await ssh.connect({
      host: '10.30.71.77',
      username: 'pocbackup',
      password: '9044472544',
      port: 22,
      readyTimeout: 5000
    });
    console.log('✅ Successfully connected to Backup server from Laptop!');

    console.log('Testing if Backup server can reach the Primary Server (10.30.80.148)...');
    const pingCode = await ssh.execCommand('ping -c 2 10.30.80.148');
    console.log('Ping Result:', pingCode.stdout);
    if(pingCode.stderr) console.log('Ping Error:', pingCode.stderr);
    
    ssh.dispose();
  } catch(e) {
    console.error('❌ Failed:', e.message);
  }
}

testConnection();
