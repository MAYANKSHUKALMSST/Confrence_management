import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function check() {
  try {
    await ssh.connect({ host: '172.16.100.24', username: 'mayank', password: '9044472544', port: 22 });
    
    const pm2Res = await ssh.execCommand('pm2 status');
    console.log('--- PM2 STATUS ---\n', pm2Res.stdout);
    if(pm2Res.stderr) console.log('PM2 ERR:\n', pm2Res.stderr);
    
    const nginxRes = await ssh.execCommand('echo "9044472544" | sudo -S nginx -t');
    console.log('--- NGINX TEST ---\n', nginxRes.stdout);
    if(nginxRes.stderr) console.log('NGINX TEST ERR:\n', nginxRes.stderr);

    const nginxLog = await ssh.execCommand('echo "9044472544" | sudo -S journalctl -xeu nginx.service --no-pager | tail -n 20');
    console.log('--- NGINX LOG ---\n', nginxLog.stdout);

    ssh.dispose();
  } catch (err) {
    console.error('Error connecting:', err);
  }
}

check();
