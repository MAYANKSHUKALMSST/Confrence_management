import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkNginx() {
  try {
    await ssh.connect({
      host: '10.30.71.77',
      username: 'pocbackup',
      password: '9044472544',
      port: 22
    });

    console.log('\n--- Nginx Test ---');
    const nginxTest = await ssh.execCommand('echo "9044472544" | sudo -S nginx -t');
    console.log(nginxTest.stdout);
    console.log('STDERR:', nginxTest.stderr);

    console.log('\n--- Nginx Status ---');
    const nginxStatus = await ssh.execCommand('echo "9044472544" | sudo -S systemctl status nginx');
    console.log(nginxStatus.stdout);
    console.log('STDERR:', nginxStatus.stderr);

  } catch (e) {
    console.error(e.message);
  } finally {
    ssh.dispose();
  }
}

checkNginx();
