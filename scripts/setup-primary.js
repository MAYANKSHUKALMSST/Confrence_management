import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function configurePrimaryKeepalived() {
  try {
    console.log('🔗 Connecting to Primary (172.16.100.24)...');
    await ssh.connect({
      host: '172.16.100.24',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });

    console.log('📦 Installing keepalived...');
    await ssh.execCommand('echo "9044472544" | sudo -S apt-get update');
    await ssh.execCommand('echo "9044472544" | sudo -S apt-get install -y keepalived');

    console.log('⚙️  Configuring keepalived...');
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
    state MASTER
    interface eno1
    virtual_router_id 51
    priority 101
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

    const tmpPath = '/tmp/keepalived.conf';
    await ssh.execCommand(`echo '${config}' > ${tmpPath}`);
    await ssh.execCommand('echo "9044472544" | sudo -S cp /tmp/keepalived.conf /etc/keepalived/keepalived.conf');
    await ssh.execCommand('echo "9044472544" | sudo -S systemctl enable keepalived');
    await ssh.execCommand('echo "9044472544" | sudo -S systemctl restart keepalived');

    console.log('✅ Keepalived configured on Primary.');
    
    const status = await ssh.execCommand('ip addr show eno1');
    console.log('\n--- Primary Interface Status ---');
    console.log(status.stdout);

  } catch (e) {
    console.error('❌ Failed:', e.message);
  } finally {
    ssh.dispose();
  }
}

configurePrimaryKeepalived();
