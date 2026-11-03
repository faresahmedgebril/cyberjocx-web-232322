# Deployment references

The active CyberJocx production topology is documented in [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md).

Official references:
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages): current frontend publishing target.
- [Cloudflare Workers](https://developers.cloudflare.com/workers/): current backend/API runtime.
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/): the single NVD schedule.
- [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/): connection path from the Worker to Neon PostgreSQL.
- [Neon PostgreSQL](https://neon.com/docs/introduction): production database and branch management.

Render references in older repository files describe a retired deployment attempt; Render is not part of the active production topology.
