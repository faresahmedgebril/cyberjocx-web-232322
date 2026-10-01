# CyberJocx Development Preview

## Full local stack

Run:

    docker compose up --build

Open http://localhost:3000

The app container runs the API plus the production frontend. MySQL runs in a separate container.

Stop:

    docker compose down

Remove the database volume too:

    docker compose down -v

## Public frontend preview

The Development Preview workflow builds the frontend and publishes it to GitHub Pages on every push to main.

After GitHub Pages is enabled for this repository with GitHub Actions as the source, the preview URL is:

https://faresahmedgebril.github.io/cyberjocx-web-232322/

Set the repository variable VITE_API_BASE_URL to the public API URL before using authenticated/API features from the preview.

GitHub Pages hosts the frontend only. It does not replace the API, database, worker, or storage services.

## Deployment model

    GitHub
      |
      +-- main push
      |     +-- Docker Build CI
      |     +-- GitHub Pages frontend preview
      |
      +-- Dockerfile
            +-- API
            +-- Worker

    Production:
    Browser -> Cloudflare/CDN -> Dockerized API -> MySQL
                                   +-> S3/R2
                                   +-> AI provider
                                   +-> NVD
                             Worker -> MySQL

No Manus runtime or Manus-specific deployment is required by the application.
