# CyberJocx Deployment

CyberJocx is containerized. Docker is the canonical runtime for the API and worker.

## Local Docker

Run:

    docker compose up --build

Open:

http://localhost:3000

The compose stack contains:
- Dockerized API + frontend
- MySQL 8.4
- Dockerized background worker

## Render / Docker production

The root render.yaml uses the same Dockerfile for:
- API Web Service
- Background Worker
- NVD Cron Job

Set the required secrets and provider variables from .env.example in the deployment platform. Never put server secrets in the frontend or GitHub Pages variables.

The API exposes:
- GET /health for liveness
- GET /ready for database readiness

The Docker API container runs database migrations before startup.

## Public development preview

The GitHub Actions Pages workflow builds the frontend on every push to main.

Expected project URL:

https://faresahmedgebril.github.io/cyberjocx-web-232322/

If GitHub Pages is not enabled yet, enable it in repository Settings -> Pages and choose GitHub Actions as the source.

Set the repository variable VITE_API_BASE_URL to the public API URL if the preview needs API-backed features.

GitHub Pages is only the frontend preview. The API, MySQL, worker, storage, and AI services remain server-side.

## Production topology

    Browser
       |
       v
    Cloudflare / CDN
       |
       v
    Dockerized API
       |
       +---- MySQL
       +---- S3/R2 storage
       +---- AI provider
       +---- NVD
       |
       v
    Dockerized Worker

GitHub main is the source of truth. Every push runs Docker build CI and updates the frontend preview workflow.
