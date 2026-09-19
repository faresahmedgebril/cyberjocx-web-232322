# CyberJocx Web

CyberJocx is a React/Vite frontend and Express/tRPC modular monolith backed by MySQL and Drizzle ORM. Authentication, storage, AI, notifications, scheduling, and background work are application-owned and provider-neutral.

## Requirements

- Node.js 22+
- pnpm 10+
- MySQL 8-compatible database
- S3-compatible object storage for profile media
- Google OAuth client for sign-in
- Optional OpenAI-compatible AI endpoint

## Installation

```bash
pnpm install
cp .env.example .env
```

Fill in the required values in `.env`. Do not commit `.env` or credentials.

## Environment variables

The authoritative template is `.env.example`. Production requires `DATABASE_URL`, `JWT_SECRET`, Google OAuth credentials and redirect URI, storage credentials, and `CRON_SECRET`. `VITE_*` values are public browser configuration only.

## Development

```bash
pnpm dev
```

The combined development server runs the API and Vite frontend at `http://localhost:3000`.

## Database setup and migrations

```bash
pnpm db:generate
pnpm db:migrate
```

Migrations are explicit. They are not run automatically during application startup.

## Testing and verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Production build

```bash
pnpm build:client
pnpm build:server
pnpm build:worker
pnpm start
```

The frontend build is written to `dist/public`. The backend bundle is `dist/index.js`. The worker bundle is `dist/worker.js`.

## Cloudflare deployment

Cloudflare can provide DNS, CDN, WAF, edge protection, rate limiting, and static frontend hosting. Build the client with `pnpm build:client` and publish `dist/public` through Cloudflare Pages or equivalent static hosting. Set `VITE_API_BASE_URL` to the public Render API URL.

## Render deployment

Use `render.yaml` as the starting point for the Render Web Service, background worker, and scheduled job. The Web Service runs the Express/tRPC API and exposes `/health` and `/ready`. The worker shares the same codebase and service layer.

## Worker and cron deployment

The scheduled job calls `POST /api/scheduled/nvd-sync` with `x-cron-secret`. The endpoint authenticates the request and enqueues a durable MySQL job. The Render Worker claims and executes it. See `DEPLOYMENT.md` for the exact temporary deployment procedure.

## Architecture

The request path is:

```text
Browser → Cloudflare → Render API → Express → tRPC → Zod → Auth → Authorization → Service → Repository → MySQL
```

AI requests use `AIService → AIProvider → configured OpenAI-compatible endpoint`. Profile media uses `StorageProvider → S3/R2-compatible storage`. NVD work uses the scheduled endpoint and worker boundary. See `ARCHITECTURE.md` for the detailed architecture and security model.
