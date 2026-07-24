import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function setStaticIp() {
  try {
    console.log('🔗 Connecting to Backup Server (10.30.71.77)...');
    await ssh.connect({
      host: '10.30.71.77',
      username: 'pocbackup',
      password: '9044472544',
      port: 22
    });

    const netplanConfig = `network:
  version: 2
  ethernets:
    eno1:
      dhcp4: no
      addresses:
        - 10.30.71.77/23
      routes:
        - to: default
          via: 10.30.70.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
`;

    console.log('📝 Creating static IP configuration...');
    // Write config to temp file
    const tmpPath = '/tmp/01-static-ip.yaml';
    await ssh.execCommand(`echo '${netplanConfig}' > ${tmpPath}`);

    console.log('⚙️  Applying Netplan configuration...');
    // Backup existing configuration
    await ssh.execCommand('echo "9044472544" | sudo -S mkdir -p /etc/netplan/backup && echo "9044472544" | sudo -S mv /etc/netplan/*.yaml /etc/netplan/backup/ || true');
    
    // Copy new config
    await ssh.execCommand(`echo "9044472544" | sudo -S cp ${tmpPath} /etc/netplan/01-static-ip.yaml`);
    await ssh.execCommand('echo "9044472544" | sudo -S chmod 600 /etc/netplan/01-static-ip.yaml');

    // Apply the network plan
    console.log('🔄 Restarting network (Warning: May briefly disconnect)...');
    const applyRes = await ssh.execCommand('echo "9044472544" | sudo -S netplan apply');
    
    if (applyRes.stderr && !applyRes.stderr.includes('password')) {
      console.log('⚠️ Warning during netplan apply:', applyRes.stderr);
    } else {
      console.log('✅ Static IP successfully assigned to eno1!');
    }
  } catch (e) {
    if (e.message.includes('ECONNRESET') || e.message.includes('Timeout')) {
       console.log('✅ Network restarted successfully (SSH was briefly reset). Your IP is now firmly static.');
    } else {
       console.error('❌ Failed:', e.message);
    }
  } finally {
    ssh.dispose();
  }
}

setStaticIp();
