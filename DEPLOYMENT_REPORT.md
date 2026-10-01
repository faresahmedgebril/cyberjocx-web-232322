# CyberJocx Deployment / CI Repair Report

## Audit time
2026-10-01

## Current repository commit
`b9d5a1902d1a43f8b3f3452680009f1923eaa991`

## What was checked

### GitHub Pages
**Status: PASS**

The latest Pages workflow for commit `1d5c92ab713d5c1dd13ccaeb4766f26aaa2c6d21` completed successfully.

This confirms the frontend build-and-deploy workflow is currently publishing the static frontend successfully. GitHub Pages deployment is independent from the Docker image build.

### Docker Build
**Status: FAILED, then repaired**

The Docker workflow for commit `1d5c92ab713d5c1dd13ccaeb4766f26aaa2c6d21` failed in the production image stage.

Exact failure:

```
ENOENT: no such file or directory, open '/app/patches/wouter@3.7.1.patch'
```

The first repair copied `patches/` into the dependency stage. The next CI run proved that this fixed the first failure: client, server, and worker builds all completed.

However, the production stage then ran:

```
pnpm install --prod --frozen-lockfile
```

and failed because the production image did not contain `/app/patches`.

### Final repair applied
The Dockerfile now copies the patch directory into the production image before the production `pnpm install`:

```dockerfile
COPY --from=build /app/patches ./patches
RUN pnpm install --prod --frozen-lockfile
```

Commit containing this repair:

`b9d5a1902d1a43f8b3f3452680009f1923eaa991`

A new Docker workflow is expected to run automatically from this commit.

## Why this happened

`package.json` declares a patched dependency:

```json
"patchedDependencies": {
  "wouter@3.7.1": "patches/wouter@3.7.1.patch"
}
```

Therefore pnpm needs the patch file during every install that uses the lockfile, including the production install. Docker initially copied the patch only for the build/dependency stage, not the final production stage.

## Other observed status signals

Previous Railway status checks showed failures for:
- `cyberjocx-api`
- `cyberjocx-worker`
- `cyberjocx-nvd-sync`

Those are external Railway deployments. The GitHub Actions logs available here prove the Docker image build was failing, which can explain deployments that consume this Dockerfile, but Railway's own deployment logs are required to attribute each Railway failure conclusively.

## Google OAuth

The code review found a deployment configuration dependency rather than a frontend-only Google OAuth bug.

The frontend sends API requests to:

`VITE_API_BASE_URL + /api/...`

If `VITE_API_BASE_URL` is empty on GitHub Pages, authentication requests resolve against the GitHub Pages origin instead of the API server.

Production OAuth also requires the real values for:
- `APP_WEB_URL`
- `CORS_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

and the matching Google OAuth authorized origins / redirect URI.

No secret or external OAuth URL was invented or changed automatically.

## Frontend bundle warning

The Docker build completed the application build but emitted Vite warnings for large JavaScript chunks, including a main chunk above 1 MB.

This is a performance warning, not the cause of the Docker failure.

## Resolution summary

| Item | Result |
|---|---|
| GitHub Pages | PASS |
| Frontend build | PASS |
| Server build | PASS |
| Worker build | PASS |
| Docker production image | FAILED before final repair |
| Docker patch handling | REPAIRED |
| Railway API/Worker/NVD | Requires fresh Railway deployment verification |
| Google OAuth | Requires real API URL + OAuth deployment configuration |

## Next verification

The next automatic Docker workflow from commit `b9d5a1902d1a43f8b3f3452680009f1923eaa991` must be checked before declaring the Docker repair successful.
