import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function checkBackupStaticInfo() {
  try {
    await ssh.connect({
      host: '10.30.80.148',
      username: 'mayank',
      password: '9044472544',
      port: 22
    });

    console.log('--- Backup IP Address Check (Bridge) ---');
    // Using sshpass to handle password via primary
    const ipCheck = await ssh.execCommand('sshpass -p "9044472544" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa pocbackup@10.30.80.77 "ip a show eno1"');
    console.log(ipCheck.stdout || ipCheck.stderr);

    console.log('\n--- Backup Netplan Config Check ---');
    const netplanCheck = await ssh.execCommand('sshpass -p "9044472544" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa pocbackup@10.30.80.77 "cat /etc/netplan/*.yaml"');
    console.log(netplanCheck.stdout || netplanCheck.stderr);

    ssh.dispose();
  } catch(e) {
    console.error('Bridge inspection failed:', e.message);
  }
}

checkBackupStaticInfo();
