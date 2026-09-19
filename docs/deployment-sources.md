# Deployment references

The deployment runbook was cross-checked against these official documents:

- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/): Pages accepts a build command and build output directory; environment variables are configured in the Pages project settings. The repository-specific output is `dist/public` because Vite is configured to write there.
- [Render Blueprint specification](https://render.com/docs/blueprint-spec): Blueprints support web, private (`pserv`), worker, cron, and key-value services; Postgres databases are represented separately under `databases`.
- [Render MySQL deployment](https://render.com/docs/deploy-mysql): MySQL is deployed as a private Docker service using the Render MySQL example, with a persistent disk mounted at `/var/lib/mysql`; the private hostname is used by other Render services.
- [Render Cron Jobs](https://render.com/docs/cronjobs): Cron jobs run a command on a UTC schedule, receive environment variables, cannot use persistent disks, and should exit after completing their run.

No external deployment URL was available in this session because Render required account sign-in and no authenticated Cloudflare deployment connector was present.
