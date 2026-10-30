# Render + Neon deployment guide

This blueprint intentionally creates **one Render Free Web Service**. It serves the Vite frontend and Express API from the same origin and starts the queue worker inside the API process. Render Free does not provide free standalone Background Worker or Cron instances, and its web instance sleeps after 15 minutes without inbound traffic.

## 1. Create the Neon database

1. Create a project in Neon and select a region close to Render Frankfurt.
2. Copy the **pooled** PostgreSQL connection string from Neon.
3. Keep the connection string private. Do not commit it to GitHub or paste it into source files.

The first Render deploy runs the generated PostgreSQL schema migrations from `drizzle-postgres/`. The migration files are generated during the Render build from `drizzle/schema.ts`.

## 2. Create the Render service

1. Connect the GitHub repository to Render.
2. Choose **New > Blueprint** and select this repository.
3. Render reads `render.yaml` and creates the `cyberjocx-api` Free Web Service.
4. When prompted, provide the Neon pooled connection string as `DATABASE_URL`.
5. The blueprint generates `JWT_SECRET` and `CRON_SECRET` automatically.

The app's public URL is read from Render's `RENDER_EXTERNAL_URL` runtime variable. The frontend and API use the same domain, so no separate static-site service or cross-site session cookie is required.

## 3. Enable hourly NVD synchronization

The workflow `.github/workflows/nvd-sync.yml` triggers the protected API endpoint once per hour. Add these two repository Actions secrets under **GitHub > Settings > Secrets and variables > Actions**:

- `RENDER_API_URL`: the Render service URL, for example `https://cyberjocx-api.onrender.com`.
- `RENDER_CRON_SECRET`: the exact generated `CRON_SECRET` value from the Render service environment.

The workflow retries requests to give a sleeping Render instance time to wake up. You can test it with **Actions > Hourly NVD sync > Run workflow**.

## 4. Optional integrations

Add these only when you have the corresponding credentials:

- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- GitHub OAuth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- Password reset email: `RESEND_API_KEY`, `AUTH_EMAIL_FROM`.
- Object storage: configure the S3/R2 environment variables used by the app.
- AI features: `AI_API_KEY`.

Google and GitHub callback URLs are derived from the incoming HTTPS host unless you explicitly configure their redirect URI environment variables.

## 5. Important database migration boundary

This deploy creates an **empty PostgreSQL schema** in Neon. It does not copy rows from the old Railway MySQL volume.

The original Railway MySQL service and its `mysql-volume` must be kept untouched until a verified MySQL dump is obtained and imported. The previous Railway environment was offline when this branch was prepared, so no export or row-count verification was possible. Do not delete the old Railway project, service, or volume. Once the old database is reachable again, export it and perform the MySQL-to-PostgreSQL data migration separately, then verify row counts and critical user records before switching production traffic.

## Free-tier limitations

- Render Free Web Services sleep after 15 minutes without inbound traffic and need roughly a minute to wake.
- The embedded queue worker only runs while that web process is awake. Lab provisioning jobs remain queued while it sleeps and resume when the API wakes.
- Hourly NVD sync relies on GitHub Actions to wake the service. It is not a continuously running worker.
- Neon Free storage and compute quotas apply; monitor usage in the Neon Console.
