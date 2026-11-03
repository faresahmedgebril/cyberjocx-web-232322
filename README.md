# CyberJocx

CyberJocx is a cybersecurity learning platform built with React, TypeScript, tRPC, Cloudflare Workers and Neon PostgreSQL.

## Production architecture

- **Frontend:** React 19 + Vite, published on GitHub Pages.
- **API:** Cloudflare Worker `cyberjocx-api`, exposing REST authentication routes and the tRPC application API.
- **Database:** Neon PostgreSQL, reached by the Worker through Cloudflare Hyperdrive.
- **AI:** Server-side NEXUS AI service using the configured provider. Provider credentials must never be shipped to the browser.
- **Scheduled threat intelligence:** Cloudflare Worker Cron Trigger for NVD synchronization.

The active production request path is **not Render or MySQL**. Older Render/MySQL references in legacy deployment files are historical and are not part of the live request path.

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

Configure local values in `.env` and never commit credentials. The production Worker uses Cloudflare bindings and Hyperdrive rather than browser-exposed environment variables.

For the Gmail Apps Script mail bridge setup, see [GMAIL_BRIDGE_SETUP.md](GMAIL_BRIDGE_SETUP.md).

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

The API is hosted by the Cloudflare Worker `cyberjocx-api`. Neon PostgreSQL is connected through Cloudflare Hyperdrive. See [docs/DEPLOYMENT_ARCHITECTURE.md](docs/DEPLOYMENT_ARCHITECTURE.md) for the production topology, authentication callbacks, scheduler and operational checks.

Public frontend: https://faresahmedgebril.github.io/cyberjocx-web-232322/

## UI features

The existing login/authentication page and main home dashboard layout remain intact. The platform also includes:

- **Leaderboard:** all-time points from `users.points`; daily, weekly and monthly points from `xpTransactions`. No mock members or hardcoded point totals.
- **Settings:** profile name/bio updates, browser-persisted accent color and the supported dark-theme preference. Unimplemented settings actions are marked Coming Soon.
- **NEXUS Assistant:** the existing protected AI API and its platform context. Attachments and persistent chat history are not currently implemented.

See [ARCHITECTURE.md](ARCHITECTURE.md) for component connections, data flow and security boundaries, and [docs/UI_INTEGRATION.md](docs/UI_INTEGRATION.md) for the Figma integration scope.
