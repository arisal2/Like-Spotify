# Bedlam-Like-Music

A self-hosted music app with browser playback, personal playlists, and mood-based mixes. Built with Go, React, and MySQL, with Docker Compose for local use and Kubernetes with Argo CD for GitOps deployments.

[Quick start](#quick-start) · [Development](#development) · [Deployment](#deployment-and-cicd) · [Documentation](#documentation)

## Features

- **Music player:** seek, queue, shuffle, repeat, volume, and session restore.
- **Personal library:** account-scoped likes, playlists, saved mixes, and listening history.
- **Discovery:** local tag-based recommendations and optional AI-assisted mixes.
- **API security:** cookie sessions, CSRF protection, rate limits, and strict JSON validation.
- **Operations:** health probes, structured logs, and non-root, read-only application containers.

Audio, artwork, and secrets are not included in the repository.

## Quick start

### Requirements

- Docker Desktop with Docker Compose.
- Audio and artwork you have permission to use, if you want to play music.

### Start the app

```bash
cp .env.example .env
```

Edit `.env` and replace both example database passwords, then start the stack:

```bash
docker compose up --build
```

Open **<http://localhost:8080>**. Compose starts MySQL, runs database migrations, and starts the API and web app.

| Service                         | Local address                          |
| ------------------------------- | -------------------------------------- |
| Web app                         | <http://localhost:8080>                |
| API catalog through the web app | <http://localhost:8080/api/v1/catalog> |
| API, for debugging              | <http://localhost:8081>                |
| MySQL                           | `127.0.0.1:3307`                       |

### Add your media

Place audio in `assets/music/` and artwork in `assets/images/artwork/`, using the filenames in [`songs.json`](backend/internal/catalog/songs.json). To use another media directory, set `MEDIA_PATH` in `.env`; keep the same directory structure beneath it.

The catalog loads without media files, but missing audio and artwork return `404`.

### Common commands

```bash
# Check service status
docker compose ps

# Follow application logs
docker compose logs -f api web

# Stop the stack while keeping database data
docker compose down
```

To reset the local database, run `docker compose down --volumes`. This deletes the Compose database volume.

## Architecture

```text
Browser
   │
   ▼
React SPA / nginx
   │ /api and /media
   ▼
Go API
   ├── MySQL              Accounts, playlists, and listening data
   ├── Media storage      Local files or a Kubernetes persistent volume
   └── Optional AI        Assisted mix generation
```

The browser uses a single origin. nginx serves the React app and proxies API and media requests to Go. The API handles authentication, authorization, persistence, recommendations, and access to allowed media files.

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | React 19, TypeScript 7, Vite 8, nginx-unprivileged      |
| Backend  | Go 1.27, `net/http`                                     |
| Storage  | MySQL 8.4, filesystem / persistent volumes              |
| Quality  | Biome, Vitest, Playwright, Go tests, govulncheck, Trivy |
| Delivery | Docker, GitHub Actions, GHCR, Kustomize, Argo CD        |

See the [architecture guide](docs/architecture.md) for request flows and design details.

## Development

For native development, install **Go 1.27.x**, **Node.js 26.x**, and **npm 12.2.2**. The [development guide](docs/development.md#run-services-natively) explains how to run MySQL in Compose and the API and Vite locally, without rebuilding containers for each edit.

Run backend checks from the repository root:

```bash
cd backend
go test -race ./...
go vet ./...
```

Run frontend checks from the repository root:

```bash
cd web
npm ci
npm run lint
npm test
npm run build
```

Playwright covers browser behavior. CI uses a generated WAV fixture, so browser tests do not need third-party music. See [development and testing](docs/development.md) for integration tests and browser test setup.

### Repository layout

```text
backend/             Go API, migrations, catalog, and tests
web/                 React app and browser tests
deploy/k8s/          Kubernetes manifests and environment overlays
deploy/argocd/       Argo CD configuration
.github/workflows/   CI, image publishing, and promotion workflows
docs/                Architecture, setup, API, and operations guides
```

## Deployment and CI/CD

The local topology has three nodes: one control plane, one test worker, and
one production worker. Separate namespaces and Argo CD instances manage each
environment, with selectors and taints keeping workloads on their assigned worker.

```text
PR → development → CI → changed ARM64 images → deploy/test → test Argo CD
          └── verify test → PR → master → CI → deploy/production
                                                 → production Argo CD
```

Delivery compares changes against the last published source and reuses unchanged
images. Production promotion copies the tested image set without rebuilding.
Repository approval rules must be configured separately.

| Environment                | Application             | Argo CD                  |
| -------------------------- | ----------------------- | ------------------------ |
| Test                       | <http://localhost:8080> | <https://localhost:8082> |
| Local production rehearsal | <http://localhost:8083> | <https://localhost:8084> |

Application URLs become available after workflow publication, runtime Secret
creation, and GitOps activation. Start with the [Argo CD guide](docs/argo-cd.md)
and [CI/CD setup](docs/github-actions.md). See [environment limits](docs/deployment-environments.md)
for shared-host availability, storage, and local HTTP considerations.

## Documentation

| Guide                                                         | Contents                            |
| ------------------------------------------------------------- | ----------------------------------- |
| [Documentation index](docs/README.md)                         | All project guides                  |
| [Product requirements](docs/bedlam-like-music-prd.md)         | Product scope and direction         |
| [Architecture](docs/architecture.md)                          | Components, data, and request flows |
| [Development](docs/development.md)                            | Local services and testing          |
| [API reference](docs/api.md)                                  | HTTP endpoints                      |
| [GitHub Actions and GitOps](docs/github-actions.md)           | CI, publishing, and promotion       |
| [Deployment environments](docs/deployment-environments.md)    | Environment configuration           |
| [Argo CD](docs/argo-cd.md)                                    | Docker Desktop Kubernetes setup     |
| [Operations](docs/operations.md)                              | Backup, recovery, and rollback      |
| [Production readiness](docs/production-readiness-template.md) | Review checklist before production  |
| [Security policy](SECURITY.md)                                | Security guidance and reporting     |

## Project status

The project supports local and self-hosted use. Production readiness remains a separate milestone; a Docker Desktop deployment alone does not establish it.

Planned areas of improvement include object storage and signed media URLs, metrics and tracing, automated backups with restore drills, catalog administration and transcoding, load testing, and expanded account recovery. Use the [production readiness checklist](docs/production-readiness-template.md) to track operational requirements before a production rollout.

## Media and licensing

Only store and serve audio and artwork you have permission to use. `assets/` and `media-backup/` are ignored by Git. Keep media backups on separate storage and test restoration.

No open-source license has been declared. Do not assume permission to redistribute the source or media.
