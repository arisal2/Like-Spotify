# Development and testing

## Requirements

- Go 1.27.x
- Node.js 26.x and npm 12.2.2
- Docker Desktop with Compose
- `kubectl` with Kustomize support for manifest validation
- Playwright Chromium for browser tests

## Repository layout

```text
backend/              Go API, migrations, catalog, and tests
web/                  React app, player, unit tests, and Playwright tests
deploy/k8s/           base, local, GitOps, media, and access manifests
deploy/argocd/        Argo CD project, application, and local service
.github/workflows/    CI, delivery, and release publishing
docs/                 architecture, API, operations, and setup guides
```

## Run the complete stack

```bash
cp .env.example .env
# Set unique MYSQL_PASSWORD and MYSQL_ROOT_PASSWORD values.
docker compose up --build
```

The web UI is on port 8080, the API is also published directly on 8081 for
debugging, and MySQL is published on 3307. All published Compose ports bind to
`127.0.0.1`.

```bash
docker compose ps
docker compose logs -f db migrate api web
curl --fail http://localhost:8080/health/web
curl --fail http://localhost:8080/api/v1/catalog
```

## Run services natively

The easiest development database is the Compose `db` service:

```bash
docker compose up -d db
cd backend
DATABASE_DSN='like_spotify:<password>@tcp(127.0.0.1:3307)/like_spotify?parseTime=true' \
  go run ./cmd/server migrate
DATABASE_DSN='like_spotify:<password>@tcp(127.0.0.1:3307)/like_spotify?parseTime=true' \
APP_ORIGIN='http://127.0.0.1:5173' \
MEDIA_DIR='../assets' \
  go run ./cmd/server
```

In another terminal:

```bash
cd web
npm ci
npm run dev
```

## Test matrix

### Backend

```bash
cd backend
test -z "$(gofmt -l .)"
go vet ./...
go test ./...
go test -race ./...
go run golang.org/x/vuln/cmd/govulncheck@latest ./...
```

Database integration tests run when `TEST_MYSQL_DSN` points to a reachable
MySQL instance. CI supplies its own MySQL service.

### Frontend

```bash
cd web
npm ci
npm run lint
npm test
npm run build
npm audit
```

Biome checks correctness, suspicious-code, and security rules. TypeScript still
performs type checking during `npm run build`; these are complementary checks.

### Browser

```bash
docker compose up --build -d
cd web
npx playwright install --with-deps chromium
npm run test:e2e
```

The CI workflow generates a deterministic 30-second PCM WAV using
`web/e2e/generate-audio.mjs`, points only the test browser catalog at that file,
and verifies that real media metadata loads. No copyrighted fixture is stored
in Git.

### Kubernetes manifests

```bash
kubectl kustomize deploy/k8s/base >/tmp/like-base.yaml
cp deploy/k8s/local/secrets.env.example deploy/k8s/local/secrets.env
kubectl kustomize deploy/k8s/local >/tmp/like-local.yaml
kubectl kustomize deploy/k8s/gitops >/tmp/like-gitops.yaml
kubectl kustomize deploy/argocd >/tmp/like-argocd.yaml
```

Never commit `deploy/k8s/local/secrets.env` with real values.

## Change workflow

1. Branch from current `master`.
2. Keep changes scoped and use conventional commit messages.
3. Run the relevant checks locally.
4. Open a pull request; do not push changes directly to `master`.
5. Merge only after required checks pass.
6. Verify the post-merge test, image promotion, and Argo CD sync.
