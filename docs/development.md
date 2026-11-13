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
web/                  React studio, audio engine, unit tests, and Playwright tests
deploy/k8s/           base, local, GitOps, media, and access manifests
deploy/argocd/        Argo CD project, application, and local service
.github/workflows/    CI, delivery, and release publishing
docs/                 architecture, API, operations, and setup guides
```

## Run the complete stack

```bash
cp .env.example .env
mkdir -p assets/music assets/images/artwork
# Set unique MYSQL_PASSWORD and MYSQL_ROOT_PASSWORD values.
docker compose up --build
```

Open <http://localhost:8080>. The studio does not require preloaded music files;
microphone recording asks for browser permission. Stop the stack with
`docker compose down`.

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
DATABASE_DSN='bedlam_like_music:<password>@tcp(127.0.0.1:3307)/bedlam_like_music?parseTime=true' \
  go run ./cmd/server migrate
DATABASE_DSN='bedlam_like_music:<password>@tcp(127.0.0.1:3307)/bedlam_like_music?parseTime=true' \
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

Studio browser tests use generated audio and a simulated microphone. Focused
studio changes run their selected Chromium journeys against Vite without Go or
MySQL. Shared changes and pull requests to `master` use the full browser job,
which starts the API and a MySQL service. See [CI/CD](github-actions.md) for
the selection rules. No copyrighted fixture is stored in Git.

### Kubernetes manifests

```bash
kubectl kustomize deploy/k8s/base >/tmp/like-base.yaml
cp deploy/k8s/local/secrets.env.example deploy/k8s/local/secrets.env
kubectl kustomize deploy/k8s/local >/tmp/like-local.yaml
kubectl kustomize deploy/k8s/test >/tmp/like-gitops.yaml
kubectl kustomize deploy/argocd >/tmp/like-argocd.yaml
```

Never commit `deploy/k8s/local/secrets.env` with real values.

Rendering proves that Kustomize input is valid; it does not install Argo CD or
publish images. For an optional manual cluster smoke test, build the local
images before applying the local overlay:

```bash
docker build -f backend/Dockerfile -t bedlam-like-music-api:local .
docker build -f web/Dockerfile -t bedlam-like-music-web:local .
kubectl apply -k deploy/k8s/local
kubectl apply -f deploy/k8s/migration-job.yaml
```

Use [the Argo CD guide](argo-cd.md) for the persistent GitOps deployment. Do
not manually apply the GitOps overlay: Argo CD owns it and obtains its exact
image tags from `deploy/test`.

## Change workflow

1. Branch from current `development`.
2. Keep changes scoped and use conventional commit messages.
3. Run the relevant checks locally.
4. Open a pull request; do not push changes directly to `development`.
5. Merge only after required checks pass.
6. Verify the post-merge test, image promotion, and Argo CD sync.

For the current three-node topology and production promotion rules, see
[deployment environments](deployment-environments.md) and [CI/CD](github-actions.md).
