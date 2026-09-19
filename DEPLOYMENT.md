# CyberJocx Temporary Production Deployment

## Current status

The repository is deployment-ready, but no Cloudflare or Render account is connected in this session. The Render dashboard redirected to its sign-in page, and no Cloudflare deployment connector or authenticated deployment API is available. Therefore no real Pages URL, Render URL, MySQL instance, Worker, or Cron run is claimed as deployed.

The following instructions are the exact deployment contract for the temporary environment.

## Cloudflare Pages

Create a Pages project from the repository with:

```text
Build command: pnpm install --frozen-lockfile && pnpm build:client
Build output directory: dist/public
Node version: 22
Package manager: pnpm 10
```

Set only public browser configuration in Pages:

```text
VITE_API_BASE_URL=https://<actual-render-api>.onrender.com
VITE_ANALYTICS_ENDPOINT=<optional public endpoint>
VITE_ANALYTICS_WEBSITE_ID=<optional public ID>
```

Do not add `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, `CRON_SECRET`, `AI_API_KEY`, or storage private keys to Pages. The Pages-generated `https://<project>.pages.dev` origin must be copied exactly into the Render API `APP_WEB_URL` and `CORS_ORIGINS` values.

## Render Web Service

Create a Node Web Service from the repository:

```text
Build: pnpm install --frozen-lockfile && pnpm build:server
Pre-deploy: pnpm db:migrate
Start: pnpm start
Health check: /health
```

Set the backend variables from `.env.example`. At minimum, production requires `DATABASE_URL`, `APP_WEB_URL`, `CORS_ORIGINS`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `CRON_SECRET`, storage bucket/credentials, and the NVD URL. The AI key is optional; AI requests return a normalized configuration error while the rest of the server continues to start.

Use these temporary values after actual resource creation:

```text
APP_WEB_URL=https://<project>.pages.dev
CORS_ORIGINS=https://<project>.pages.dev
GOOGLE_OAUTH_REDIRECT_URI=https://<actual-render-api>.onrender.com/api/auth/google/callback
SESSION_COOKIE_SAMESITE=none
SESSION_COOKIE_SECURE=true
```

`/health` is liveness. `/ready` returns 200 only when the database client is available.

## Render MySQL

Render's official MySQL deployment is a separate private Docker service based on `render-examples/mysql`, not a Blueprint `databases:` resource. Follow the Render MySQL guide and configure:

```text
MYSQL_DATABASE=<database name>
MYSQL_USER=<application user>
MYSQL_PASSWORD=<strong password>
MYSQL_ROOT_PASSWORD=<strong root password>
```

Attach a persistent Render Disk at exactly:

```text
/var/lib/mysql
```

Use MySQL 8 unless compatibility requires otherwise. Connect the API and Worker through the private service address and set `DATABASE_URL` only on those server-side services. Do not expose MySQL publicly. Apply migrations with:

```bash
pnpm db:migrate
```

The migrations in `drizzle/0007_application_sessions.sql` and `drizzle/0008_jobs.sql` are additive. Do not drop or reset production tables.

## Render Worker

Create a separate Background Worker using:

```text
Build: pnpm install --frozen-lockfile && pnpm build:worker
Start: pnpm worker
```

Give it the same `DATABASE_URL` as the Web Service and the NVD variables. It polls the durable `jobs` table and uses the same NVD service implementation as the API. Do not run a second copy of the application logic.

## Render Cron

Create a separate Cron Job:

```text
Schedule: 0 * * * *
Build: pnpm install --frozen-lockfile && pnpm build:server
Command: the protected POST command in render.yaml
```

Set:

```text
API_BASE_URL=https://<actual-render-api>.onrender.com
CRON_SECRET=<the exact same value configured on the API>
```

The cron endpoint is:

```text
POST /api/scheduled/nvd-sync
Header: x-cron-secret: <secret>
```

It returns `202` after creating a durable job. The Worker claims and executes that job. The API does not perform the NVD import synchronously.

## Google OAuth

After the actual Render URL and temporary Pages URL exist, add this callback URL to the Google OAuth client:

```text
https://<actual-render-api>.onrender.com/api/auth/google/callback
```

Configure the Render API with the same URL in `GOOGLE_OAUTH_REDIRECT_URI`. Set `APP_WEB_URL` to the Pages URL so successful login returns to the frontend. Keep the Google client secret only on Render.

## Verification checklist

Run these checks against the actual URLs after deployment:

```bash
curl -fsS https://<actual-render-api>.onrender.com/health
curl -fsS https://<actual-render-api>.onrender.com/ready
curl -i -X OPTIONS https://<actual-render-api>.onrender.com/api/trpc \
  -H 'Origin: https://<project>.pages.dev' \
  -H 'Access-Control-Request-Method: POST'
```

Then verify Pages loading, static assets, public tRPC procedures, protected procedure rejection, Google login, session persistence, logout, Worker startup, protected NVD enqueue, and the first Cron/Worker job completion. Uploads and AI require their respective provider credentials.

## Future custom domain

When the domain is purchased:

1. Add it to Cloudflare.
2. Connect it to Pages.
3. Optionally create `api.<domain>` and point it to Render.
4. Update `VITE_API_BASE_URL` in Pages.
5. Update `APP_WEB_URL` and `CORS_ORIGINS` in Render.
6. Update `GOOGLE_OAUTH_REDIRECT_URI` and the Google client.
7. Keep `SESSION_COOKIE_SAMESITE=none` for separate frontend/API sites unless the final topology makes a stricter policy possible.
8. Redeploy and repeat the authentication/CORS checks.

No source-code rewrite is required because all URLs are environment-configured.
