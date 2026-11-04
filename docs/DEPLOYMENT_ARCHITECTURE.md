# CyberJocx deployment architecture

Last verified: 2026-11-04

## Active production topology

- **Frontend:** GitHub Pages. The repository workflow builds the Vite client into `dist/public` and publishes it under `/cyberjocx-web-232322/`.
- **Backend/API:** Cloudflare Worker `cyberjocx-api` at `https://cyberjocx-api.gebrilfares972.workers.dev`. It handles `/health`, `/ready`, and `/api/*`, and proxies frontend paths to the GitHub Pages site.
- **Database:** Neon PostgreSQL project `CyberJocx Production`, default branch `main`. The Worker connects through its Cloudflare Hyperdrive binding.
- **NVD scheduler:** Cloudflare Worker Cron Trigger only. GitHub Actions is not a scheduler for NVD and must not call retired Render endpoints.

## Worker source and request-scoped database connections

- The checked-in Cloudflare adapter is `server/cloudflare-worker.ts`. It owns the API proxy, frontend path proxy, and scheduled NVD entry point; `server/worker.ts` remains the separate Node.js background job runner.
- Build the deployable Worker module with `pnpm build:cloudflare-worker`. The build keeps the Cloudflare `cloudflare:node` request bridge external and bundles the application code.
- The Worker sets `DB_REQUEST_SCOPED=true` before importing the Express application. Every HTTP request receives its own AsyncLocalStorage database context. A `pg.Client` connects lazily at the first DB operation and is closed when the response finishes/closes. Hyperdrive pools upstream connections.
- In Worker mode, database calls without a request scope fail closed. Conventional Node.js hosts keep the existing process-scoped Pool fallback.
- PostgreSQL diagnostic logs include only safe metadata (SQLSTATE, severity and validated schema/table/column/constraint identifiers); SQL text, bind parameters, email addresses and OAuth credentials are not logged.
- The app schema and Neon data are unchanged. This repair requires no migration or destructive database operation.

## NVD scheduled execution

The Cloudflare Cron Trigger runs at minute 17 of every hour (UTC) and invokes the Worker `scheduled` handler. The handler calls the authenticated internal route `POST /api/scheduled/nvd-sync` with the Worker secret binding `CRON_SECRET`.

The API handler:
1. Rejects requests without the matching `x-cron-secret` (or Bearer) value.
2. Enqueues an `nvd-sync` database job.
3. Claims one queued `nvd-sync` job.
4. Runs the NVD import, upserts CVE records, and records the run outcome.
5. Marks the queue job completed or failed. A successful HTTP response means the job was processed, not merely enqueued.

The importer uses a 48-hour lookback window and batches of 200 CVEs per NVD API page. Repeated records are upserted by CVE ID.

## Operational checks

- `GET /health`: checks that the Worker API is responding.
- `GET /ready`: checks that the application can obtain a database connection.
- `GET /api/auth/google/login` and `GET /api/auth/github/login`: OAuth initiation routes; a complete OAuth test must be finished through the real provider browser redirect and callback.
- `GET /api/auth/me` (or the current session endpoint used by the client): must be tested with a valid session cookie/token to verify persistence after reload.
- Neon `nvdSyncRuns`, `nvdSyncSettings`, `jobs`, and `cves` are the source of truth for successful synchronization.

## Authentication and session configuration

- Password authentication uses opaque random session tokens. The database stores a SHA-256 token hash in Neon; it does not require a JWT signing secret.
- The frontend stores the returned session token in tab-scoped `sessionStorage`, sends it as a Bearer token to tRPC, and also accepts the HttpOnly session cookie. A page reload in the same tab should retain the session.
- The Worker must have `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` configured as secret bindings. Client secrets must be the actual credentials from the provider consoles; never substitute placeholders.
- Current callback URLs:
  - Google: `https://cyberjocx-api.gebrilfares972.workers.dev/api/auth/google/callback`
  - GitHub: `https://cyberjocx-api.gebrilfares972.workers.dev/api/auth/github/callback`
- The 2026-11-03 Cloudflare Worker settings audit listed both `GOOGLE_CLIENT_SECRET` and `GITHUB_CLIENT_SECRET` as `secret_text` bindings. Their values are intentionally not readable from Worker metadata. The OAuth initiation routes have passed redirect smoke tests; a full browser authorization/callback round-trip is still the correct final verification.

## Retired infrastructure

Render was used in an earlier deployment attempt. It is not part of the active production request path or NVD scheduler. Keep any legacy Render blueprint/document as historical reference only; do not restore its URLs or secrets to active workflows.

Cloudflare Pages and GitHub Pages are different products. CyberJocx's current frontend is GitHub Pages; Cloudflare runs the API Worker.


## Worker release process

The repository does not use a Wrangler configuration or an automatic Cloudflare Worker deployment workflow. The checked-in adapter is built with `pnpm build:cloudflare-worker`; GitHub Actions verifies that bundle and the Node app, but does not publish it to `cyberjocx-api`. GitHub Pages deployment is a separate workflow. Treat API Worker uploads as a distinct release: upload a new version while inheriting existing Hyperdrive and secret bindings, deploy it, and verify `/health`, `/ready`, OAuth initiation, and database-backed tRPC procedures before declaring the API update live.
