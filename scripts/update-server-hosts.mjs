import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();
const PRIMARY_IP = '10.30.80.148';
const VIP = '10.30.80.50';
const DOMAIN = 'conferencebooking.tp-link.com';

async function main() {
  try {
    await ssh.connect({
      host: PRIMARY_IP,
      username: 'mayank',
      password: '9044472544'
    });

    console.log('📝 Adding domain to /etc/hosts on pockali...');
    
    // Check if it already exists to avoid duplicates
    const checkRes = await ssh.execCommand(`grep "${DOMAIN}" /etc/hosts`);
    
    if (checkRes.stdout) {
      console.log('ℹ️ Entry already exists, updating it...');
      const updateCmd = `echo '9044472544' | sudo -S sed -i "/${DOMAIN}/c\\${VIP}  ${DOMAIN}" /etc/hosts`;
      await ssh.execCommand(updateCmd);
    } else {
      console.log('➕ Adding new entry...');
      const addCmd = `echo '9044472544' | sudo -S sh -c "echo '${VIP}  ${DOMAIN}' >> /etc/hosts"`;
      await ssh.execCommand(addCmd);
    }

    console.log('✅ /etc/hosts updated!');
    ssh.dispose();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

main();
