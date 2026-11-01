# CyberJocx Cloudflare Workers MVP

This directory is an isolated deployment adapter. It deliberately does not replace the existing Node/Express server yet.

## Current status

- [x] Dedicated migration branch created from `main`.
- [x] Worker health endpoint scaffolded.
- [x] Neon connectivity probe scaffolded through Cloudflare Hyperdrive.
- [ ] Create a Hyperdrive binding for the existing Neon PostgreSQL database.
- [ ] Port authentication, tRPC, OAuth callbacks, password reset and background jobs.
- [ ] Run integration/security tests against a non-production Neon branch.
- [ ] Switch the GitHub Pages frontend API URL only after the required routes pass tests.

The `/api/*` fallback intentionally returns HTTP 501. It prevents the frontend from appearing to work while authentication and application routes are not implemented.

## Local development

From the repository root:

```bash
pnpm install
pnpm exec wrangler dev --config cloudflare/wrangler.jsonc
```

The repository already depends on `pg`; the Worker uses its Node.js compatibility implementation with Hyperdrive. For local development, configure a local Hyperdrive connection string using Wrangler's documented local binding override. Never commit database credentials.

## Neon connection

Create a Cloudflare Hyperdrive configuration pointing to the existing Neon pooled PostgreSQL connection. Use the Neon pooled connection string, keep credentials in Cloudflare-managed configuration, and replace the placeholder ID in `wrangler.jsonc`. Do not put the connection string in GitHub files or frontend environment variables.

Database migrations remain a separate deployment step. Run Drizzle migrations from a trusted Node.js environment using Neon’s direct/unpooled connection string; do not run schema migrations during every Worker request.

## Portability rules

- PostgreSQL remains the source of truth; no Cloudflare D1-specific schema.
- Keep Drizzle schema and SQL migrations in the existing `drizzle/` directories.
- Keep business rules independent of Express, Hono, or Workers request objects.
- Keep secrets in environment configuration, never in source code or Vite variables.
- Keep a conventional Node.js adapter as the VPS deployment target.
- Use Hyperdrive only as a connection transport/pool. The application data model remains ordinary PostgreSQL.

## Known blockers that must be solved before production

1. **Express is not a Workers runtime.** The current API uses Express middleware, Express request/response objects and the tRPC Express adapter. These need a Workers-compatible adapter; simply deploying `server/_core/index.ts` will not work.
2. **Password hashing.** Existing password authentication uses synchronous Node `scryptSync`. Do not replace it with a fast, weak hash. Benchmark a Workers-compatible password KDF with safe parameters and preserve compatibility with existing password hashes, or retain auth on a Node host until a safe migration is ready.
3. **Cross-site sessions.** GitHub Pages' `github.io` origin and a `workers.dev` API are different sites. Cookie-based sessions need a deliberate browser-compatible design and security tests. Do not move session tokens into localStorage as a shortcut. A custom domain for the frontend and an API subdomain under the same registrable domain is the preferred long-term setup.
4. **Background processing.** The current embedded worker polls a PostgreSQL jobs table every five seconds and cleans labs every minute. That process model does not carry over to Workers; use scheduled/queue-driven execution with idempotent jobs.
5. **OAuth callbacks and email.** Google/GitHub callback URLs and password-reset links must be updated only after the final API hostname is chosen.

## Deployment safety

Do not change `VITE_API_BASE_URL` or the current GitHub Pages deployment workflow until the Worker implements the frontend's required endpoints and passes auth/session, CORS/CSRF, database and regression tests.
