import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkNetwork() {
  try {
    await ssh.connect({
      host: '10.30.80.148',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });

    console.log('Fetching ip route...');
    const route = await ssh.execCommand('ip route | grep default');
    console.log('Route:', route.stdout);

    console.log('Fetching resolver info...');
    const dns = await ssh.execCommand('resolvectl status | grep "DNS Server" -A 2');
    console.log('DNS:', dns.stdout);

  } catch (e) {
    console.error(e);
  } finally {
    ssh.dispose();
  }
}

checkNetwork();
