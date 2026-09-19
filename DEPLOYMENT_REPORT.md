# CyberJocx Temporary Deployment Report

## Deployment status

No external deployment was claimed. The Render dashboard was reachable but redirected to `https://dashboard.render.com/login`, and no authenticated Cloudflare deployment connector was available in this session. No Pages URL, Render URL, database endpoint, secret, or successful external smoke test was invented.

| Component | Status | Evidence or blocker |
|---|---|---|
| Cloudflare Pages | Prepared, not deployed | `pnpm build:client`, output `dist/public`; Cloudflare account/project access unavailable |
| Render Web Service | Prepared, not deployed | `pnpm build:server`, `pnpm start`, `/health`, `/ready`; Render account requires sign-in |
| Render MySQL | Procedure documented, not provisioned | Requires a Render private Docker MySQL service and persistent disk |
| Drizzle migrations | Prepared locally, not applied remotely | Requires actual `DATABASE_URL`; migrations are additive |
| Render Worker | Prepared, not deployed | `pnpm build:worker`, `pnpm worker`; requires production MySQL |
| Render Cron | Prepared, not deployed | `render.yaml`; requires actual API URL and shared `CRON_SECRET` |
| Google OAuth | Code-ready, not externally verified | Requires Google credentials and actual Render callback URL |
| Storage | Code-ready, not externally verified | Requires S3/R2 endpoint, bucket, and private credentials |
| AI | Optional and code-ready | Requires server-side `AI_API_KEY` for AI requests |

## Frontend

Cloudflare Pages configuration:

```text
Build command: pnpm install --frozen-lockfile && pnpm build:client
Output directory: dist/public
Public variable: VITE_API_BASE_URL=https://<actual-render-api>.onrender.com
```

The actual Pages `pages.dev` hostname is not known because no Pages project was created in the available session.

## Backend

Render Web Service configuration:

```text
Build command: pnpm install --frozen-lockfile && pnpm build:server
Pre-deploy command: pnpm db:migrate
Start command: pnpm start
Health check: /health
Readiness: /ready
```

The actual `onrender.com` hostname is not known because no Render service was created in the available session.

## Database

The project remains on Drizzle/MySQL. The application does not expose `DATABASE_URL` through Vite. Render's official MySQL procedure uses a private Docker service based on the Render MySQL example repository and a persistent disk mounted at `/var/lib/mysql`. See the [Render MySQL guide](https://render.com/docs/deploy-mysql). The API and Worker must receive the private connection string through server-side configuration only.

## Worker and Cron

The Worker polls the durable `jobs` table and executes the shared NVD service. The Cron job sends a protected `POST /api/scheduled/nvd-sync` request with `x-cron-secret`. The endpoint enqueues work and returns `202`; it does not run the import synchronously.

## Authentication and cookies

Google OAuth remains application-owned. The callback URL is configurable through `GOOGLE_OAUTH_REDIRECT_URI`, and successful authentication redirects to `APP_WEB_URL`. For the temporary Pages-to-Render topology, configure:

```text
SESSION_COOKIE_SAMESITE=none
SESSION_COOKIE_SECURE=true
APP_WEB_URL=https://<project>.pages.dev
CORS_ORIGINS=https://<project>.pages.dev
```

Cookies remain HttpOnly and server-controlled. Browser JavaScript does not receive session tokens.

## Security

- CORS is an explicit comma-separated allowlist; wildcard origins are not used.
- Credentialed requests are enabled only for allowed origins.
- Production state-changing requests require an allowed Origin/Referer.
- Cross-site session behavior is configurable and enforces Secure cookies for `SameSite=None`.
- OAuth state is validated before code exchange.
- Storage credentials, OAuth secrets, AI keys, database credentials, and cron secrets are server-only.
- File uploads retain MIME, size, and safe-key validation.
- Runtime bundles contain no retired platform runtime identifiers.

## Local verification

| Command | Result |
|---|---|
| `pnpm typecheck` | Passed after deployment hardening |
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm test` | Passed: 4 files, 9 tests |
| `pnpm build` | Passed: client/API/worker |
| `pnpm build:client` | Passed as part of `pnpm build` |
| `pnpm build:server` | Passed as part of `pnpm build` |
| `pnpm build:worker` | Passed as part of `pnpm build` |
| `pnpm exec prettier --check render.yaml` | Passed |
| Local HTTP smoke test | Passed: `/health` 200, `/ready` 503 without database, CORS preflight 204, unauthenticated cron 403 |
| `pnpm exec prettier --check render.yaml` | Passed |
| Wildcard CORS scan | Passed; no wildcard found |
| Render dashboard access | Blocked by sign-in |
| Cloudflare deployment access | Not configured |

## Real blockers

1. A Render account with repository access is required to create the Web Service, private MySQL service, Worker, and Cron.
2. A Cloudflare account with Pages access is required to create the temporary Pages project and obtain its actual `pages.dev` hostname.
3. The actual Pages hostname and Render API hostname must be inserted into server-side `APP_WEB_URL`, `CORS_ORIGINS`, `GOOGLE_OAUTH_REDIRECT_URI`, the Cron `API_BASE_URL`, and Pages `VITE_API_BASE_URL`.
4. Production MySQL, S3/R2, and Google OAuth credentials must be supplied by the deployment owner. AI credentials are required only to enable AI calls.
5. After those values exist, remote migrations and the complete production smoke-test checklist must be run against the real URLs.
