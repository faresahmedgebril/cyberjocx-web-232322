# CyberJocx — Weekly encrypted Neon backup to Google Drive

The workflow `.github/workflows/backup-neon-to-drive.yml` creates a PostgreSQL custom-format dump of the **CyberJocx Production** Neon database every Sunday at 00:00 UTC (02:00 Cairo time during Egypt's UTC+2 period). It can also be started manually from GitHub Actions.

The backup is encrypted on the ephemeral GitHub Actions runner using AES-256-GCM before upload. The plaintext dump and encrypted staging file are removed from the runner after the upload attempt. The workflow does not write backup contents into Neon or another application table.

## One-time setup required

Google Drive is not connected to this ChatGPT workspace, so the upload cannot be authenticated or tested from this chat. The workflow is committed as an implementation, but it will fail safely until the following GitHub repository secrets are configured.

Open **GitHub → CyberJocx repository → Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
|---|---|
| `NEON_DATABASE_URL` | The **direct, non-pooled** connection string for the Neon Production `main` branch and `neondb`. Do not use a hostname containing `-pooler`. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key for a Google Cloud service account with Drive API enabled. |
| `GOOGLE_DRIVE_FOLDER_ID` | The ID of the destination folder in a Google **Shared Drive**. Add the service account to that Shared Drive with permission to create files (Contributor or higher). |
| `BACKUP_ENCRYPTION_PASSPHRASE` | A randomly generated passphrase of at least 32 characters. Keep a copy in a separate password manager; it is required to decrypt and restore backups. |

A Shared Drive is recommended for service-account uploads. Sharing a normal personal My Drive folder with a service account can fail because service accounts do not have normal personal Drive storage quota. Do not upload the service-account JSON, database URL, or encryption passphrase to the repository.

## What each weekly run does

1. Uses the PostgreSQL 18 client to create a custom-format `pg_dump` from Neon.
2. Derives an encryption key from the passphrase using scrypt and encrypts the dump with AES-256-GCM.
3. Verifies the encrypted payload locally.
4. Uploads the encrypted file to the configured Shared Drive folder.
5. Reads the uploaded Drive metadata and verifies the uploaded byte size.
6. Deletes the temporary plaintext and encrypted staging files from the runner.

The Drive filename begins with `cyberjocx-neon-weekly-` and ends with `.dump.enc`. Backups are retained in Drive; this workflow does not automatically delete older backups.

## First-run verification

After adding all four secrets, open **Actions → Weekly encrypted Neon backup to Google Drive → Run workflow**. The first successful run must show:

- PostgreSQL dump created.
- Backup encrypted, uploaded and size-verified.
- A Drive filename and file ID in the workflow log.

A green workflow is the confirmation that upload succeeded. Until the first green run, do not treat the weekly backup as active.

## Restore procedure

1. Download the encrypted `.dump.enc` file from the Shared Drive.
2. Use the same passphrase from the password manager to decrypt it. The file layout is: 8-byte format marker, 16-byte salt, 12-byte nonce, then AES-GCM ciphertext and authentication tag. The key is derived with scrypt `N=32768, r=8, p=1`.
3. Restore the decrypted custom-format dump to a **new Neon branch or separate recovery database first**, not over production:
   `pg_restore --no-owner --no-acl --dbname="$RECOVERY_DATABASE_URL" cyberjocx-neon-weekly.dump`
4. Validate users, sessions, CVEs, courses, and other expected tables before planning any production cutover.

The backup is encrypted at rest in Drive. Losing the passphrase means the encrypted backups cannot be decrypted.

## Operational notes

- Schedule: once per week, Sunday 00:00 UTC.
- Trigger: GitHub Actions cron plus manual dispatch.
- Target: Google Drive Shared Drive, not the Neon database.
- Encryption: AES-256-GCM with a key derived by scrypt.
- Temporary runner files: removed on success or failure.
- Retention: older Drive backups are not automatically pruned; manage retention in Drive according to the project's storage policy.
- Scope: database backup only. GitHub source code is already version-controlled separately; R2/object-storage media is not included by this database dump.
