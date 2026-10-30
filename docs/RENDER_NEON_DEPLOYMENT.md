# Render + Neon deployment guide

This Blueprint creates two free Render services:

- **Static Site** (`cyberjocx-web-232322`) builds and serves the Vite frontend from `dist/public`.
- **Web Service** (`cyberjocx-api-232322`) serves the Express API and embeds the queue worker in the same process.

Render Free does not offer separately hosted Background Worker or Cron instances. The hourly NVD schedule therefore uses GitHub Actions to wake the API and enqueue the job. Render Free Web Services sleep after 15 minutes without inbound traffic; after wake-up, startup can take about one minute.

## 1. Create the Neon database

1. Create a Neon project in the Frankfurt region (or the nearest region available to the Render service).
2. Copy the **pooled PostgreSQL connection string** from Neon.
3. Keep the connection string private. Do not commit it to GitHub or paste it into source files.

The first API deployment applies the generated PostgreSQL migrations from `drizzle-postgres/`. Render generates these during the API build from `drizzle/schema.ts`.

## 2. Create the Render services

1. Connect the GitHub repository to Render.
2. Choose **New > Blueprint** and select this repository, using the `deploy/render-neon-free` branch until the PostgreSQL migration is approved.
3. Render reads `render.yaml` and creates the API Web Service and frontend Static Site.
4. When prompted, provide the Neon pooled connection string as `DATABASE_URL`.
5. The API Blueprint generates `JWT_SECRET` and `CRON_SECRET` automatically.

The Blueprint expects these default Render service URLs:
- API: `https://cyberjocx-api-232322.onrender.com`
- Frontend: `https://cyberjocx-web-232322.onrender.com`

If Render assigns a different hostname, update these three settings to match the actual URLs:
- API `APP_WEB_URL`: frontend origin.
- API `CORS_ORIGINS`: frontend origin.
- Static Site `VITE_API_BASE_URL`: API URL.

The frontend and API use separate hosts, but both are under `onrender.com`. The API sets the allowed frontend origin and redirects OAuth/password-reset flows back to the Static Site.

## 3. Enable hourly NVD synchronization

The workflow `.github/workflows/nvd-sync.yml` triggers the protected API endpoint once per hour. Add these two repository Actions secrets under **GitHub > Settings > Secrets and variables > Actions**:

- `RENDER_API_URL`: the API service URL, for example `https://cyberjocx-api-232322.onrender.com`.
- `RENDER_CRON_SECRET`: the exact generated `CRON_SECRET` value from the Render API environment.

The workflow retries requests to give a sleeping Render instance time to wake up. You can test it with **Actions > Hourly NVD sync > Run workflow** after the workflow is present on the repository's default branch.

## 4. Optional integrations

Add these only when you have the corresponding credentials:

- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- GitHub OAuth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
- Password reset email: `RESEND_API_KEY`, `AUTH_EMAIL_FROM`.
- Object storage: configure the S3/R2 environment variables used by the app.
- AI features: `AI_API_KEY`.

Google and GitHub callback URLs are derived from the incoming HTTPS API host unless you explicitly configure their redirect URI environment variables.

## 5. Important database migration boundary

This deploy creates an **empty PostgreSQL schema** in Neon. It does not copy rows from the old Railway MySQL volume.

The original Railway MySQL service and its `mysql-volume` must be kept untouched until a verified MySQL dump is obtained and imported. The previous Railway environment was offline when this branch was prepared, so no export or row-count verification was possible. Do not delete the old Railway project, service, or volume. Once the old database is reachable again, export it and perform the MySQL-to-PostgreSQL data migration separately, then verify row counts and critical user records before switching production traffic.

## Free-tier limitations

- Render Free Web Services sleep after 15 minutes without inbound traffic and need about a minute to wake.
- The embedded queue worker runs only while the API Web Service is awake. Lab provisioning jobs can remain queued while it sleeps and resume when the API wakes.
- Hourly NVD sync relies on GitHub Actions to wake the service. It is not a continuously running worker.
- Neon Free has 1 GB database storage per project and usage-based compute hours. Monitor the project in the Neon Console.
