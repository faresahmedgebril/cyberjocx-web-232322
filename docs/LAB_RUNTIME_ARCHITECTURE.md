# CyberJocx Lab Runtime Architecture

## Current API contract

The CyberJocx API already calls an isolated Lab Manager through the `LAB_MANAGER_URL` and `LAB_MANAGER_TOKEN` environment variables.

Provision request:

```http
POST /v1/instances
Authorization: Bearer <LAB_MANAGER_TOKEN>
Content-Type: application/json
```

The request body contains:

```json
{
  "instanceId": "unique-instance-id",
  "templateSlug": "approved-lab-template",
  "userId": 123,
  "cpuLimit": 1,
  "memoryMb": 1024,
  "diskMb": 4096,
  "pidLimit": 128,
  "ttlSeconds": 3600,
  "exposedPorts": [80, 443]
}
```

The response must contain `targetUrl`; `containerRef` is optional.

Destroy request:

```http
DELETE /v1/instances/{instanceId}
Authorization: Bearer <LAB_MANAGER_TOKEN>
```

The API Worker now forwards `LAB_MANAGER_URL` and `LAB_MANAGER_TOKEN` from its Worker bindings into the server runtime. The service itself has not been deployed yet.

## Recommended runtime shape

Use a dedicated Lab Manager Worker backed by Cloudflare Containers and Durable Objects:

1. A separate Durable Object / Container identity per lab instance (not one shared container for all students).
2. A manager-only reverse proxy route for each `instanceId`. Do not expose the container runtime or Docker API to the browser.
3. Resolve `templateSlug` against an owner-approved template registry. Never execute an arbitrary image URL submitted by an instructor directly.
4. Keep lab images immutable (pin approved builds to image digests) and keep runtime environment variables/secrets out of instructor-controlled fields.
5. Enforce owner-approved CPU, memory, disk, PID, exposed-port and TTL ceilings on the server. Treat request values as untrusted even if the instructor UI validated them.
6. Disable general outbound internet by default. Add narrow egress allowlists only for labs that require them.
7. Stop and destroy expired instances, and ensure one user's session cannot address another user's instance.
8. Treat container filesystems as disposable. Store only intentionally persistent state in an external store.

Cloudflare's Container platform is designed for a Worker to route requests to container instances, with Durable Objects managing lifecycle and instance identity. Initial image deployment is performed through Wrangler and needs a Docker build environment. See:
- https://developers.cloudflare.com/containers/get-started/
- https://developers.cloudflare.com/containers/concepts/architecture/
- https://developers.cloudflare.com/containers/api/container-class/
- https://developers.cloudflare.com/containers/platform/limits/
- https://developers.cloudflare.com/containers/platform/pricing/

## Runtime constraints and cost gate

Cloudflare's published Workers Paid plan starts at USD 5/month and includes limited Container CPU, memory and disk usage; excess use is metered. Containers are not available on the Free plan. The default instance ceilings currently published by Cloudflare are 4 vCPU, 12 GiB memory and 20 GB disk. The current instructor proposal form allows larger values than those defaults, so the runtime adapter must clamp or reject out-of-range resource requests before a Cloudflare deployment.

Do not enable this runtime or create paid infrastructure until the account plan, an initial lab image allowlist, expected concurrent sessions and a monthly spend ceiling have been approved.

## What already exists in this repository

- Root `Dockerfile`: builds the CyberJocx Node API image and starts the application after running PostgreSQL migrations.
- Root `docker-compose.yml`: defines the API, background worker and a local **MySQL 8.4** service. This Compose file is a legacy local stack and is not a Neon-backed lab runtime.
- `.github/workflows/docker-build.yml`: builds the Docker image for CI with `push: false`; it verifies the image but does not publish or deploy a Docker service.
- `server/infrastructure/labs/provider.ts`: the existing lab adapter calls an external HTTP Lab Manager at `LAB_MANAGER_URL`; it does not start Docker containers itself.
- A repository search did not find a Docker Engine SDK, `docker.sock` mount, or a Lab Manager implementation. This is only a repository-level finding; it does not inspect a separate Docker host outside the connected project.

## Current production / integration state

- Neon project `CyberJocx Production` (`jolly-pond-42042058`), default branch `main`, is the active PostgreSQL database.
- The repository's last verified deployment architecture describes GitHub Pages for the frontend and the `cyberjocx-api` Cloudflare Worker for the API, connected to Neon through Hyperdrive. Confirm that architecture before changing the live API runtime.
- The current Cloudflare Worker does not have `LAB_MANAGER_URL` or `LAB_MANAGER_TOKEN` bindings configured.
- Cloudflare's R2 bucket API reports that R2 must first be enabled in the dashboard. R2 is intended for private course assets; it is not the lab container runtime.
- No lab-specific Docker image, container orchestration service, or lab runtime deployment is included in this PR.
- The instructor / encrypted-course migration in this PR has not been applied to the production Neon branch.
