import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
const PASSWORD = '9044472544';

async function setupCron() {
  try {
    await ssh.connect({ host: '10.30.80.148', username: 'mayank', password: PASSWORD });
    console.log('📅 Setting up 30-minute automated backup cron job...');
    
    // Create a wrapper shell script for the backup on the server
    const backupScriptContent = `#!/bin/bash
timestamp=$(date +"%Y%m%d_%H%M%S")
backup_file="/home/mayank/roombook/server/data/roombook_backup_$timestamp.db"
remote_dir="/home/pocbackup/roombook/backups/"

# 1. Create local backup
sqlite3 /home/mayank/roombook/server/data/roombook.db ".backup '$backup_file'"

# 2. Push to backup server
sshpass -p "${PASSWORD}" scp -o StrictHostKeyChecking=no "$backup_file" pocbackup@10.30.80.77:"$remote_dir"

# 3. Cleanup local temp backup
rm "$backup_file"

# 4. Cleanup old backups on backup server (keep last 8640 - approx 6 months @ 30min intervals)
sshpass -p "${PASSWORD}" ssh -o StrictHostKeyChecking=no pocbackup@10.30.80.77 "ls -t ~/roombook/backups/roombook_backup_*.db | tail -n +8641 | xargs -r rm"
`;

    await ssh.execCommand(`echo '${backupScriptContent}' > /home/mayank/roombook/scripts/auto-backup.sh`);
    await ssh.execCommand('chmod +x /home/mayank/roombook/scripts/auto-backup.sh');

    // Add to crontab (every 30 minutes)
    const cronJob = "*/30 * * * * /home/mayank/roombook/scripts/auto-backup.sh >> /home/mayank/roombook/backups/backup.log 2>&1";
    await ssh.execCommand(`(crontab -l 2>/dev/null | grep -v "daily-backup.sh"; echo "${cronJob}") | sort -u | crontab -`);

    console.log('✅ Cron job scheduled: Runs every 30 minutes.');
    ssh.dispose();
  } catch(e) {
    console.error('Error:', e.message);
  }
}
setupCron();
