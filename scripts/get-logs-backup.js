import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function getLogs() {
  try {
    await ssh.connect({host: '10.30.71.77', username: 'pocbackup', password: '9044472544'});
    const res = await ssh.execCommand('export PATH=$PATH:/usr/local/bin:/usr/bin:/home/pocbackup/.nvm/versions/node/v20*/bin && pm2 logs roombook --lines 100 --nostream');
    console.log(res.stdout);
    if(res.stderr && !res.stderr.includes('password')) console.error(res.stderr);
    ssh.dispose();
  } catch(e) {
    console.error(e.message);
  }
}
getLogs();
