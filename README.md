# Like

Like is a self-hosted music application built with Go, React, TypeScript, MySQL,
Docker, and Kubernetes. It provides browser playback, accounts, likes,
playlists, listening-history controls, and mood-based mixes without committing
copyrighted media or secrets to Git.

## Highlights

- Browser player with seek, queue, shuffle, repeat, volume, and session restore.
- Account-scoped likes, playlists, saved mixes, and listening history.
- Local tag-based recommendations with optional AI-assisted mix generation.
- Go API with cookie sessions, CSRF protection, rate limits, strict JSON input,
  health probes, and structured logs.
- Non-root, read-only containers and restricted Kubernetes workloads.
- Pull-request CI, multi-architecture images, GitOps promotion, and Argo CD
  reconciliation to a local Docker Desktop cluster.

## Stack

| Area     | Technology                                              |
| -------- | ------------------------------------------------------- |
| Web      | React 19, TypeScript 7, Vite 8, nginx-unprivileged      |
| API      | Go 1.27, `net/http`, MySQL driver                       |
| Data     | MySQL 8.4 and filesystem/PVC media storage              |
| Quality  | Biome, Vitest, Playwright, Go tests, govulncheck, Trivy |
| Delivery | Docker, GitHub Actions, GHCR, Kustomize, Argo CD        |

## Quick start with Docker

Requirements: Docker Desktop with Compose and licensed media files.

```bash
cp .env.example .env
# Replace both example database passwords in .env.
docker compose up --build
```

Open <http://localhost:8080>. Check the API at
<http://localhost:8080/api/v1/catalog>.

Media is intentionally not stored in Git. Put files under `assets/music/` and
`assets/images/artwork/` using the names in
[`songs.json`](backend/internal/catalog/songs.json), or set `MEDIA_PATH` in
`.env` to another directory. The catalog still loads when files are absent,
but audio and artwork requests return 404.

Useful commands:

```bash
docker compose ps
docker compose logs -f api web
docker compose down           # keeps the MySQL volume
docker compose down --volumes # deletes local database data
```

## Architecture

```text
Browser
   │
   ▼
React SPA served by nginx ── /api and /media ──▶ Go API
                                             │
                                      ┌─────────────┼─────────────┐
                                      ▼             ▼             ▼
                                   MySQL       media storage   optional AI
```

The browser talks to one origin. nginx serves the SPA and proxies API and media
requests to Go. The API owns authentication, authorization, persistence,
recommendations, and the narrow media-file allowlist. See
[Architecture](docs/architecture.md) for request, data, AI, and deployment
flows.

## Development

```bash
cd backend
go test -race ./...
go vet ./...

cd ../web
npm ci
npm run lint
npm test
npm run build
```

The full browser test runs against the Compose stack with Playwright. CI creates
its own deterministic WAV fixture; no third-party song is required. See the
[development guide](docs/development.md) for native services, test commands,
project layout, and contribution workflow.

## Kubernetes and GitOps

The delivery path is intentionally pull-request driven:

```text
feature branch → pull request checks → merge to master → master checks
→ multi-architecture images in GHCR → deploy/local update → Argo CD sync
```

On the configured Docker Desktop cluster:

- Application: <http://localhost:8080>
- Argo CD: <https://localhost:8082>

Start with [Argo CD and local Kubernetes](docs/argo-cd.md), then use the
[GitHub Actions and GitOps guide](docs/github-actions.md) to configure branch
protection and delivery.

First-time setup is performed in this order:

1. Enable Docker Desktop Kubernetes and verify the `docker-desktop` context.
2. Let a successful `master` workflow create `deploy/local` and publish images.
3. Install the pinned Argo CD release.
4. Create the uncommitted Kubernetes application Secret.
5. Apply `deploy/argocd` and wait for the application to become healthy.
6. Import permitted media into the persistent volume and verify both URLs.

The [local deployment guide](docs/argo-cd.md) includes every command, expected
result, private-GHCR notes, troubleshooting, upgrades, and teardown.

## Documentation

- [Product suite PRD](docs/product-suite-prd.md)
- [Documentation index](docs/README.md)
- [Architecture and design](docs/architecture.md)
- [Development and testing](docs/development.md)
- [HTTP API reference](docs/api.md)
- [Operations, backup, recovery, and rollback](docs/operations.md)
- [Argo CD on Docker Desktop](docs/argo-cd.md)
- [GitHub Actions and GitOps](docs/github-actions.md)
- [Security policy](SECURITY.md)

## Current scope and sensible next changes

The project is a strong local/self-hosted foundation, not yet a production
streaming service. High-value next changes are:

1. Add S3-compatible object storage and signed media URLs instead of serving
   files from the API process.
2. Add OpenTelemetry traces, Prometheus metrics, dashboards, and alerting.
3. Add database and media backup automation with tested restore drills.
4. Add catalog administration, uploads, metadata extraction, and background
   transcoding jobs.
5. Add pagination, database indexes, and load tests before growing the catalog.
6. Add email verification, password reset, session management, and optional
   external identity providers.
7. Add a production ingress with TLS, DNS automation, and external secret
   management before exposing it publicly.

## Media and licensing

Only use audio and artwork you are permitted to store and serve. `assets/` and
`media-backup/` are ignored by Git, but a local backup is not protection against
disk loss. Keep an encrypted backup on separate storage and test restoration.

## License

No open-source license has been declared yet. Until one is added, copyright
defaults apply; do not assume permission to redistribute the source or media.
