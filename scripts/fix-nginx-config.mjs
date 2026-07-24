import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const PRIMARY_IP = '10.30.80.148';
const VIP = '10.30.80.50';
const DOMAIN = 'conferencebooking.tp-link.com';

async function main() {
  try {
    console.log(`🔗 Connecting to Primary Server (${PRIMARY_IP})...`);
    await ssh.connect({
      host: PRIMARY_IP,
      username: 'mayank',
      password: '9044472544'
    });

    console.log('🔍 Searching for outdated Nginx config...');
    const grepRes = await ssh.execCommand("grep -lR '172.16.100.24' /etc/nginx/");
    const configFile = grepRes.stdout.trim();

    if (!configFile) {
      console.log('❌ Could not find config file with old IP.');
    } else {
      const files = configFile.split('\n');
      console.log(`✅ Found config files: ${files.join(', ')}`);

      for (const file of files) {
        console.log(`🛠️ Updating server_name in ${file}...`);
        // Use sudo -S to pass the password
        const updateCmd = `echo '9044472544' | sudo -S sed -i "s/server_name 172.16.100.24 _;/server_name ${PRIMARY_IP} ${VIP} ${DOMAIN};/g" ${file}`;
        await ssh.execCommand(updateCmd);
      }

      console.log('🔄 Restarting Nginx...');
      await ssh.execCommand("echo '9044472544' | sudo -S systemctl restart nginx");
      
      console.log('✅ Nginx updated and restarted successfully!');
    }

    ssh.dispose();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

main();
