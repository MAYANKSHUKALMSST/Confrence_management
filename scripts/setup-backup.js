import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function configureBackupKeepalived() {
  try {
    console.log('🔗 Connecting to Primary as jump host...');
    await ssh.connect({
      host: '172.16.100.24',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });

    console.log('📦 Installing keepalived on Backup via Primary jump...');
    const jumpPrefix = 'sshpass -p "9044472544" ssh -o StrictHostKeyChecking=no mayank@172.16.100.25';
    
    await ssh.execCommand(`${jumpPrefix} 'echo "9044472544" | sudo -S apt-get update'`);
    await ssh.execCommand(`${jumpPrefix} 'echo "9044472544" | sudo -S apt-get install -y keepalived'`);

    console.log('⚙️  Configuring keepalived on Backup...');
    const config = `
global_defs {
   notification_email {
     admin@localhost
   }
   notification_email_from keepalived@localhost
   smtp_server 127.0.0.1
   smtp_connect_timeout 30
}

vrrp_script check_nginx {
    script "killall -0 nginx"
    interval 2
    weight 2
}

vrrp_instance VI_1 {
    state BACKUP
    interface wlan0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass roombook_pass
    }
    virtual_ipaddress {
        172.16.100.26
    }
    track_script {
        check_nginx
    }
}
`;

    const tmpPath = '/tmp/keepalived_backup.conf';
    await ssh.execCommand(`echo '${config}' > ${tmpPath}`);
    // Use scp via jump host or simply cat/pipe the config into the remote file
    await ssh.execCommand(`cat ${tmpPath} | ${jumpPrefix} 'echo "9044472544" | sudo -S tee /etc/keepalived/keepalived.conf > /dev/null'`);
    
    await ssh.execCommand(`${jumpPrefix} 'echo "9044472544" | sudo -S systemctl enable keepalived'`);
    await ssh.execCommand(`${jumpPrefix} 'echo "9044472544" | sudo -S systemctl restart keepalived'`);

    console.log('✅ Keepalived configured on Backup.');
    
    const status = await ssh.execCommand(`${jumpPrefix} 'ip addr show wlan0'`);
    console.log('\n--- Backup Interface Status ---');
    console.log(status.stdout);

  } catch (e) {
    console.error('❌ Failed:', e.message);
  } finally {
    ssh.dispose();
  }
}

configureBackupKeepalived();
