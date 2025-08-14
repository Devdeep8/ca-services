// scripts/backup.ts
import { exec } from 'child_process';
import { config } from 'dotenv';
import { URL } from 'url';

// Load environment variables from .env file
config();

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined in your .env file.');
  process.exit(1);
}

try {
  const dbUrl = new URL(DATABASE_URL);
  const user = dbUrl.username;
  const password = dbUrl.password;
  const host = dbUrl.hostname;
  const database = dbUrl.pathname.substring(1); // Remove leading '/'

  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const backupFile = `backup-${database}-${timestamp}.sql`;

  // Use --password flag for non-interactive execution in scripts
  const command = `mysqldump -u "${user}" --password="${password}" -h "${host}" "${database}" > "${backupFile}"`;

  console.log(`Creating backup for database '${database}'...`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating backup: ${stderr}`);
      return;
    }
    console.log(`✅ Backup successful! Saved to ${backupFile}`);
  });

} catch (err) {
  console.error('Failed to parse DATABASE_URL.', err);
  process.exit(1);
}