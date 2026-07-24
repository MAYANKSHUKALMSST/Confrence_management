import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function fixBackupAttendeeEmails() {
  try {
    const host = '10.30.80.77';
    const user = 'pocbackup';
    const path = '/home/pocbackup/roombook';
    
    console.log(`🔗 Connecting to ${host} to fix attendee_emails column...`);
    await ssh.connect({ host, username: user, password: '9044472544' });

    const sql = 'ALTER TABLE bookings ADD COLUMN attendee_emails TEXT NOT NULL DEFAULT \\"\\"';
    const jsCmd = `node -e "const D=require('better-sqlite3');const db=new D('server/data/roombook.db');try{db.exec('${sql}');console.log('OK');}catch(e){console.error(e.message);}"`;
    
    const res = await ssh.execCommand(jsCmd, { cwd: path });
    console.log(`✅ Result: ${res.stdout || res.stderr}`);

    ssh.dispose();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

fixBackupAttendeeEmails();
