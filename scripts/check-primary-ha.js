import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkPrimaryHA() {
  try {
    await ssh.connect({
      host: '10.30.80.148',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });

    console.log('--- Keepalived Status ---');
    const status = await ssh.execCommand('echo "9044472544" | sudo -S systemctl status keepalived --no-pager');
    console.log(status.stdout);

    console.log('\n--- Keepalived Logs ---');
    const logs = await ssh.execCommand('echo "9044472544" | sudo -S journalctl -u keepalived -n 50 --no-pager');
    console.log(logs.stdout);

    ssh.dispose();
  } catch(e) {
    console.error(e.message);
  }
}

checkPrimaryHA();
