import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function testConnection() {
  try {
    console.log('Connecting to Backup 10.30.80.77...');
    await ssh.connect({
      host: '10.30.80.77',
      username: 'pocbackup',
      password: '9044472544',
      port: 22,
      readyTimeout: 3000
    });
    console.log('✅ Connected to Backup!');

    const res = await ssh.execCommand('ping -c 2 10.30.80.148');
    console.log('Ping to Primary:', res.stdout);
    
    ssh.dispose();
  } catch(e) {
    console.error('❌ Failed to reach Backup 10.30.80.77:', e.message);
  }
}

testConnection();
