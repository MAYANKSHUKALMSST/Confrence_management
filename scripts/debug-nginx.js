import { NodeSSH } from 'node-ssh';
import 'dotenv/config';

const ssh = new NodeSSH();
const SSH_HOST = '172.16.100.138';
const SSH_USER = 'mayank';
const SSH_PASSWORD = process.env.SSH_PASSWORD;

async function debugNginx() {
  try {
    await ssh.connect({ host: SSH_HOST, username: SSH_USER, password: SSH_PASSWORD });

    console.log('--- CURL 10.30.71.50 ---');
    const curlVip = await ssh.execCommand('curl -I http://10.30.71.50');
    console.log(curlVip.stdout || curlVip.stderr);

    console.log('\n--- CURL 172.16.100.138 ---');
    const curlHost = await ssh.execCommand('curl -I http://172.16.100.138');
    console.log(curlHost.stdout || curlHost.stderr);

    ssh.dispose();
  } catch (e) {
    console.error('Debug failed:', e.message);
  }
}

debugNginx();
