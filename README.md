# CyberJocx

CyberJocx is a cybersecurity learning platform built with React, TypeScript, tRPC, Cloudflare Workers and Neon PostgreSQL.

## Production architecture

- **Frontend:** React 19 + Vite, published on GitHub Pages.
- **API:** Cloudflare Worker `cyberjocx-api`, exposing REST authentication routes and the tRPC application API.
- **Database:** Neon PostgreSQL, reached from the Worker through Cloudflare Hyperdrive.
- **AI:** Server-side NEXUS AI service using the configured provider. Provider credentials must never be shipped to the browser.
- **Scheduled threat intelligence:** Cloudflare Worker Cron Trigger for NVD synchronization.

The active production deployment is **not Render or MySQL**. Older Render/MySQL references in legacy deployment files are historical and are not part of the live request path.

## Requirements

- Node.js 22+
- pnpm 10+
- PostgreSQL connection for local backend development
- Provider credentials only when enabling OAuth, email delivery, storage or AI features

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Configure local environment values in `.env`. Never commit secrets. The production Worker uses Cloudflare bindings and Hyperdrive rather than browser-exposed environment variables.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build:client
pnpm build:server
pnpm build:worker
```

## Deployment

The frontend is built into `dist/public` and published to GitHub Pages by `.github/workflows/deploy-pages.yml` on `main`.

The API is hosted by the Cloudflare Worker `cyberjocx-api`. Neon PostgreSQL is connected through Cloudflare Hyperdrive. Consult [docs/DEPLOYMENT_ARCHITECTURE.md](docs/DEPLOYMENT_ARCHITECTURE.md) for the production topology, authentication callbacks, scheduler and operational checks.

Public frontend: https://faresahmedgebril.github.io/cyberjocx-web-232322/

## UI features

The existing login and home dashboard remain intact. The application also includes:

- **Leaderboard:** uses persisted all-time user points and transaction-based daily/weekly/monthly points; no hardcoded demo rankings.
- **Settings:** profile name/bio updates, browser-persisted accent color and dark-theme preference. Unimplemented settings are marked Coming Soon.
- **NEXUS Assistant:** uses the existing protected AI API and platform context. Attachments and chat-history persistence are not yet implemented.

See [ARCHITECTURE.md](ARCHITECTURE.md) for component connections, data flow and security boundaries.
