import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '172.16.100.138';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function debugServer() {
  try {
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });

    console.log('--- IP ADDR ---');
    const ipRes = await ssh.execCommand('ip addr show');
    console.log(ipRes.stdout);

    console.log('\n--- KEEPALIVED STATUS ---');
    const statusRes = await ssh.execCommand('systemctl status keepalived');
    console.log(statusRes.stdout);

    console.log('\n--- KEEPALIVED LOGS (tail 20) ---');
    const logsRes = await ssh.execCommand('journalctl -u keepalived -n 20 --no-pager');
    console.log(logsRes.stdout);

    console.log('\n--- NGINX STATUS ---');
    const nginxRes = await ssh.execCommand('systemctl status nginx');
    console.log(nginxRes.stdout);

    ssh.dispose();
  } catch (e) {
    console.error('Debug failed:', e.message);
  }
}

debugServer();
