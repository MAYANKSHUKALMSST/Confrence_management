import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '172.16.100.138';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function checkRoutes() {
  try {
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });

    console.log('--- IP ROUTE ---');
    const routeRes = await ssh.execCommand('ip route');
    console.log(routeRes.stdout);

    console.log('\n--- IP ADDR ---');
    const ipRes = await ssh.execCommand('ip addr show');
    console.log(ipRes.stdout);

    ssh.dispose();
  } catch (e) {
    console.error('Debug failed:', e.message);
  }
}

checkRoutes();
