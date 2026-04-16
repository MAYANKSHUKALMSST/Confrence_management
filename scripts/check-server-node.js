import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '172.16.100.138';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function checkServer() {
  try {
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });
    const nodeRes = await ssh.execCommand('node -v && npm -v');
    console.log(nodeRes.stdout);
    ssh.dispose();
  } catch (e) {
    console.error('Check failed:', e.message);
  }
}

checkServer();
