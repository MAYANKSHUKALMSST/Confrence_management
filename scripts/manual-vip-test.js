import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function manualVipTest() {
  try {
    await ssh.connect({
      host: '10.30.80.148',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });

    console.log('Attempting to manually bind 10.30.80.50...');
    const res = await ssh.execCommand('echo "9044472544" | sudo -S ip addr add 10.30.80.50/32 dev eno1');
    console.log('Result:', res.stdout || 'Success');
    if(res.stderr) console.log('Error:', res.stderr);

    const status = await ssh.execCommand('ip addr show eno1');
    console.log('\n--- Interface Status ---');
    console.log(status.stdout);

    ssh.dispose();
  } catch(e) {
    console.error(e.message);
  }
}

manualVipTest();
