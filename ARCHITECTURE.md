# CyberJocx Architecture

Last reviewed: 2026-11-03

## Production topology

The production application is split into a static frontend, an API Worker, and a managed PostgreSQL database.

```mermaid
flowchart TD
    U["Browser / User"] --> GH["GitHub Pages\nVite + React 19"]
    GH -->|HTTPS + credentials| CF["Cloudflare Worker\ncyberjocx-api"]
    CF --> EX["Express-compatible API\nREST Auth + tRPC"]
    EX --> MW["Middleware\nCORS · Origin checks · Rate limits"]
    MW --> ROUTER["Application routers\nZod input validation"]
    ROUTER --> AUTH["Auth & session services"]
    ROUTER --> DOMAIN["Learning · CVE · Malware\nCommunity · Market · Profile"]
    ROUTER --> AI["NEXUS AI service"]
    ROUTER --> LB["Leaderboard router"]
    ROUTER --> SETTINGS["Profile preferences"]
    AUTH --> HD["Cloudflare Hyperdrive"]
    DOMAIN --> HD
    LB --> HD
    SETTINGS --> HD
    HD --> NEON["Neon PostgreSQL\nCyberJocx Production"]
    AI --> PROVIDER["Configured AI provider"]
    GH --> ASSETS["Static assets\nGitHub Pages artifact"]
```

### Frontend routes and feature connections

```mermaid
flowchart TD
    APP["React App / Wouter"] --> AUTH_PAGE["AuthPage\nExisting login / signup"]
    APP --> HOME["Home application shell"]
    HOME --> DASH["FigmaDashboard\nExisting home dashboard"]
    HOME --> PROFILE["ProfileView"]
    HOME --> LEARNING["LearningView / TracksView"]
    HOME --> INTEL["CVE / Malware / Tools"]
    HOME --> COMMUNITY["CommunityView"]
    HOME --> MARKET["MarketView"]
    HOME --> LEADER["LeaderboardView"]
    HOME --> SETTINGS["SettingsView"]
    HOME --> NEXUS["NexusAssistantView"]
    LEADER --> TRPC_LB["tRPC leaderboard.list"]
    TRPC_LB --> DB_USERS["users.points / public profile fields"]
    TRPC_LB --> XP["xpTransactions for day/week/month"]
    SETTINGS --> LOCAL["localStorage\nAccent color"]
    SETTINGS --> THEME["ThemeContext\nDark mode preference"]
    SETTINGS --> PROFILE_API["tRPC profile.update\nName and bio"]
    NEXUS --> AI_API["tRPC ai.ask"]
    AI_API --> AI_CONTEXT["Published courses · tracks\nCVE/Malware counts · own profile context"]
    AI_CONTEXT --> AI_SVC["AI service / configured model"]
    AUTH_PAGE --> AUTH_API["Worker REST auth routes"]
    AUTH_API --> SESSIONS["sessions table\nSHA-256 token hash"]
```

## Request and data flows

### Authentication

1. The browser submits login, registration, password recovery, or OAuth requests to the Cloudflare Worker.
2. The API validates input, applies rate limiting and origin checks, and reads/writes the Neon user records.
3. Session tokens are generated with cryptographically secure randomness. The database stores a SHA-256 hash rather than the raw token.
4. The response establishes the session using the configured cookie/session mechanism. Protected tRPC procedures resolve the current user before accessing private data.

### Leaderboard

- All-time order uses the persisted `users.points` value.
- Today, this week, and this month use summed `xpTransactions.amount` values within the selected UTC period.
- The endpoint returns at most 50 ranked entries and the signed-in user's own position summary.
- Only public leaderboard fields are returned: display name, avatar URL, member rank, points and rank. Email, password hashes and session data are never selected.

### Settings

- Display name and bio are saved using the existing protected `profile.update` tRPC mutation.
- Accent color is a browser preference stored in localStorage and applied through CSS custom properties.
- The UI keeps unimplemented security, notification delivery, billing, connected-account management, and account deletion actions behind the shared Coming Soon modal.
- Light and automatic themes remain Coming Soon because the current application shell is intentionally dark-themed; a partial light-mode toggle would be misleading.

### NEXUS AI assistant

- The UI sends a message and the recent conversation history to the existing protected `ai.ask` mutation.
- The server composes context from published courses, learning tracks, malware records, CVE counts and the current user's own learning context.
- The AI service calls the configured provider. Provider credentials stay on the server/Worker and are not bundled into the browser.
- Chat attachments and persistent conversation history are not enabled; those controls show Coming Soon.

## Security boundaries

- Secrets and database connection details belong only in Cloudflare Worker secret bindings and Hyperdrive configuration. Never expose them as `VITE_*` values.
- The leaderboard selects only public profile fields; it does not expose email addresses or authentication data.
- Profile updates and AI requests require an authenticated session.
- User-generated text is rendered as React text/Markdown content, not injected as raw HTML.
- Uploads and any production database migration must be reviewed separately; this UI integration does not modify the database schema.

## Deployment and validation

- Frontend: GitHub Pages, built with `pnpm build:client` and deployed by `.github/workflows/deploy-pages.yml`.
- API: Cloudflare Worker `cyberjocx-api`.
- Database: Neon PostgreSQL through Cloudflare Hyperdrive.
- CI for the integration branch runs `pnpm typecheck`, `pnpm test`, and the Docker build workflow. GitHub Pages deployment remains restricted to `main`.
- See [docs/DEPLOYMENT_ARCHITECTURE.md](docs/DEPLOYMENT_ARCHITECTURE.md) for production operations and the scheduled NVD sync.

## UI integration scope

The existing login/authentication page and main home dashboard layout were retained. The integration adds the Leaderboard, Settings, and NEXUS Assistant screens inside the existing application shell and routes. Unimplemented actions use the shared Coming Soon modal instead of inert or fake-success controls.
