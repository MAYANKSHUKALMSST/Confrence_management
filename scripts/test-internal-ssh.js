import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function internalSshTest() {
  try {
    console.log('Connecting to Primary (10.30.80.148)...');
    await ssh.connect({
      host: '10.30.80.148',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });
    console.log('✅ Connected to Primary!');

    console.log('Asking Primary to SSH probe Backup (10.30.80.77)...');
    const res = await ssh.execCommand('ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no pocbackup@10.30.80.77 "echo internal_connection_ok"');
    console.log('Internal SSH Output:', res.stdout);
    console.log('Internal SSH Error:', res.stderr);
    
    ssh.dispose();
  } catch(e) {
    console.error('❌ Failed from Primary:', e.message);
  }
}

internalSshTest();
