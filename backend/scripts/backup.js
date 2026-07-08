const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const DB_NAME = 'gms_crm';
const BACKUP_DIR = path.join(__dirname, '../../backups');
const RETENTION_DAYS = 7;

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const backupDatabase = () => {
  const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const archivePath = path.join(BACKUP_DIR, `${DB_NAME}_backup_${date}.gzip`);

  console.log(`[BACKUP] Starting mongodump for ${DB_NAME}...`);
  
  const dumpProcess = spawn('mongodump', [
    `--db=${DB_NAME}`,
    `--archive=${archivePath}`,
    '--gzip'
  ]);

  dumpProcess.stdout.on('data', (data) => console.log(data.toString()));
  dumpProcess.stderr.on('data', (data) => console.error(data.toString()));

  dumpProcess.on('exit', (code) => {
    if (code === 0) {
      console.log(`[BACKUP] Successfully created backup: ${archivePath}`);
      cleanOldBackups();
    } else {
      console.error(`[BACKUP] mongodump exited with code ${code}`);
    }
  });
};

const cleanOldBackups = () => {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(filePath);
    if (now - stat.mtimeMs > retentionMs) {
      fs.unlinkSync(filePath);
      console.log(`[BACKUP] Deleted old backup: ${file}`);
    }
  });
};

// If run directly
if (require.main === module) {
  backupDatabase();
}

module.exports = backupDatabase;
