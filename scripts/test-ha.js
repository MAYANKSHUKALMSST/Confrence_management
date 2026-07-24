import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkFailover() {
  try {
    console.log('🔗 Connecting to Backup Server (10.30.71.77)...');
    await ssh.connect({
      host: '10.30.71.77',
      username: 'pocbackup',
      password: '9044472544',
      port: 22
    });

    console.log('\n--- Nginx Status ---');
    const nginxCode = await ssh.execCommand('echo "9044472544" | sudo -S systemctl status nginx --no-pager');
    console.log(nginxCode.stdout);
    if(nginxCode.stderr && !nginxCode.stderr.includes('password')) console.log('Nginx Err:', nginxCode.stderr);

    console.log('\n--- Keepalived Status ---');
    const kpCode = await ssh.execCommand('echo "9044472544" | sudo -S systemctl status keepalived --no-pager');
    console.log(kpCode.stdout);
    if(kpCode.stderr && !kpCode.stderr.includes('password')) console.log('Keepalived Err:', kpCode.stderr);

    console.log('\n--- IP Addresses ---');
    const ipCode = await ssh.execCommand('ip a show eno1');
    console.log(ipCode.stdout);

    console.log('\n--- PM2 Status ---');
    const pm2Code = await ssh.execCommand('pm2 status || export PATH=$PATH:/usr/local/bin:/usr/bin:/home/pocbackup/.nvm/versions/node/v20*/bin && pm2 status', {cwd: '/home/pocbackup/roombook'});
    console.log(pm2Code.stdout);

    console.log('\n--- Ping Primary (10.30.71.50) ---');
    const pingCode = await ssh.execCommand('ping -c 3 10.30.71.50');
    console.log(pingCode.stdout);

  } catch (e) {
    console.error('Failed to connect to 10.30.71.77:', e.message);
  } finally {
    ssh.dispose();
  }
}

checkFailover();
