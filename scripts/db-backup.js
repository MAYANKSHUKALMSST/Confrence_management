import { NodeSSH } from 'node-ssh';
import path from 'path';

const ssh = new NodeSSH();
const PRIMARY_HOST = '10.30.80.148';
const BACKUP_HOST = '10.30.80.77';
const PRIMARY_USER = 'mayank';
const BACKUP_USER = 'pocbackup';
const PASSWORD = '9044472544';

async function performBackup() {
  try {
    console.log(`🔗 Connecting to Primary (${PRIMARY_HOST})...`);
    await ssh.connect({
      host: PRIMARY_HOST,
      username: PRIMARY_USER,
      password: PASSWORD
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `roombook_backup_${timestamp}.db`;
    const localBackupPath = `/home/${PRIMARY_USER}/roombook/server/data/${backupFilename}`;
    const remoteBackupPath = `/home/${BACKUP_USER}/roombook/backups/${backupFilename}`;

    console.log(`📦 Creating local backup on Primary...`);
    // We use sqlite3 .backup to ensure a consistent copy even if the DB is in use
    await ssh.execCommand(`sqlite3 server/data/roombook.db ".backup '${localBackupPath}'"`, { cwd: `/home/${PRIMARY_USER}/roombook` });

    console.log(`📤 Pushing backup to Backup server (${BACKUP_HOST})...`);
    const scpCmd = `sshpass -p "${PASSWORD}" scp -o StrictHostKeyChecking=no ${localBackupPath} ${BACKUP_USER}@${BACKUP_HOST}:${remoteBackupPath}`;
    await ssh.execCommand(scpCmd);

    console.log(`🧹 Cleaning up old backups on Backup server (keep last 30)...`);
    const cleanupCmd = `sshpass -p "${PASSWORD}" ssh -o StrictHostKeyChecking=no ${BACKUP_USER}@${BACKUP_HOST} 'ls -t ~/roombook/backups/roombook_backup_*.db | tail -n +31 | xargs -r rm'`;
    await ssh.execCommand(cleanupCmd);

    console.log(`✅ Backup process finished.`);
    console.log(`📍 Backup stored at: ${BACKUP_HOST}:${remoteBackupPath}`);

    ssh.dispose();
  } catch (e) {
    console.error('❌ Backup Failed:', e.message);
  }
}

performBackup();
