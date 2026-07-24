import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function configureBackupKeepalived() {
  try {
    console.log('🔗 Connecting directly to Backup Server (10.30.80.77)...');
    await ssh.connect({
      host: '10.30.80.77',
      username: 'pocbackup',
      password: '9044472544',
      port: 22
    });

    console.log('📦 Installing keepalived on Backup...');
    
    await ssh.execCommand('echo "9044472544" | sudo -S apt-get update');
    await ssh.execCommand('echo "9044472544" | sudo -S apt-get install -y keepalived');

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
    interface eno1
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass roombook_pass
    }
    virtual_ipaddress {
        10.30.80.50
    }
    track_script {
        check_nginx
    }
}
`;

    const tmpPath = '/tmp/keepalived_backup.conf';
    await ssh.execCommand(`echo '${config}' > ${tmpPath}`);
    await ssh.execCommand(`echo "9044472544" | sudo -S cp ${tmpPath} /etc/keepalived/keepalived.conf`);
    
    await ssh.execCommand('echo "9044472544" | sudo -S systemctl enable keepalived');
    await ssh.execCommand('echo "9044472544" | sudo -S systemctl restart keepalived');

    console.log('✅ Keepalived configured on Backup.');
    
    const status = await ssh.execCommand('ip addr show eno1');
    console.log('\n--- Backup Interface Status ---');
    console.log(status.stdout);

  } catch (e) {
    console.error('❌ Failed:', e.message);
  } finally {
    ssh.dispose();
  }
}

configureBackupKeepalived();
