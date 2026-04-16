import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '10.30.71.50';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function checkNewIp() {
  try {
    console.log(`🔗 Attempting connection to ${SSH_HOST}...`);
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });

    console.log('✅ Connected via 10.30.71.50!');
    const ipRes = await ssh.execCommand('ip addr show');
    console.log(ipRes.stdout);

    ssh.dispose();
  } catch (e) {
    console.error('Connection failed:', e.message);
  }
}

checkNewIp();
