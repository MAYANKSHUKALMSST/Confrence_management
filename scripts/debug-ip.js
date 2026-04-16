import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '172.16.100.138';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function debugServer() {
  try {
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });

    const ipRes = await ssh.execCommand('ip addr show eno1');
    console.log('--- IP ADDR eno1 ---');
    console.log(ipRes.stdout);

    const logsRes = await ssh.execCommand('journalctl -u keepalived -n 50 --no-pager');
    console.log('\n--- KEEPALIVED LOGS ---');
    console.log(logsRes.stdout);

    ssh.dispose();
  } catch (e) {
    console.error('Debug failed:', e.message);
  }
}

debugServer();
