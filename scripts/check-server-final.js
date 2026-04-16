import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '10.30.71.50';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function checkServer() {
  try {
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });
    const lsRes = await ssh.execCommand('ls -R ~/roombook | head -n 20');
    console.log(lsRes.stdout);
    ssh.dispose();
  } catch (e) {
    console.error('Check failed:', e.message);
  }
}

checkServer();
