# Like Spotify

A small, full-stack music app rebuilt with a Go API, React with TypeScript, MySQL, Docker, and Kubernetes.

The product direction and prioritized roadmap live in [the PRD](docs/PRD.md).

## What it does

- Browse and search the bundled instrumental catalog
- Play music with a persistent queue, seek, volume, shuffle, and repeat controls
- Create an account with secure password hashing and database-backed sessions
- Like songs and create, rename, reorder, and delete playlists
- Generate catalog-grounded mood mixes from a natural-language prompt
- Run locally with Docker Compose or deploy to Kubernetes

The mood-mix feature works without an external service by matching hand-curated catalog tags. When OpenAI is configured, it uses the Responses API with Structured Outputs, validates every returned song ID, and falls back to the local generator if the provider is unavailable. Prompts and the demo catalog are sent to OpenAI when this mode is enabled; account and listening data are not included.

## Architecture

```text
Browser -> nginx / React -> Go JSON API -> MySQL
                         -> bundled audio and artwork
                         -> OpenAI (optional mood mixes)
```

- `web/`: React, TypeScript, Vite, TanStack Query, Zod, Vitest, and Playwright
- `backend/`: Go HTTP API, catalog, recommendation logic, MySQL repository, and migrations
- `deploy/k8s/`: Kubernetes base, local overlay, migration Job, and Gateway API example
- `assets/`: bundled demo music and artwork

## Local development with Docker

Requirements: Docker Desktop with Compose.

```bash
cp .env.example .env
# Replace both example database passwords in .env.
docker compose up --build
```

Open <http://localhost:8080>. The API is also exposed at <http://localhost:8081> for local inspection. MySQL is bound to `127.0.0.1:3307`.

The migration container runs before the API and is safe to run again. Application data stays in the `mysql-data` Docker volume across restarts.

Useful commands:

```bash
docker compose ps
docker compose logs -f api web
docker compose down
```

`docker compose down` preserves the database. Adding `--volumes` deletes local application data.

## Run the code directly

Requirements: Go 1.26 or newer, Node.js 24, npm, and MySQL 8.4.

```bash
cd web
npm install
npm run dev
```

In another terminal, configure a MySQL DSN, run migrations, and start the API:

```bash
cd backend
export DATABASE_DSN='like_spotify:password@tcp(127.0.0.1:3307)/like_spotify?parseTime=true'
go run ./cmd/server migrate
go run ./cmd/server
```

The Vite development server proxies `/api` and `/media` to the Go service.

## Optional OpenAI mood mixes

Set both values in `.env`:

```dotenv
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=a-model-in-your-account-that-supports-structured-outputs
```

The API key stays on the server. Do not add `.env` or Kubernetes secret files to Git.

## Tests and checks

```bash
cd backend
go test -race ./...

cd ../web
npm run lint
npm test
npm run build
```

The MySQL integration test creates and drops an isolated, randomly named database. Point it at an administrative test DSN:

```bash
cd backend
TEST_MYSQL_DSN='root:password@tcp(127.0.0.1:3307)/?parseTime=true' go test ./internal/httpapi -run TestMySQLIntegration
```

For browser tests, start the Compose stack and install Playwright's browser once:

```bash
cd web
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs backend race tests, isolated MySQL integration tests, frontend checks, browser tests, Kubernetes rendering, and multi-architecture release builds.

## CI/CD and Argo CD

The delivery path is GitOps-based:

```text
push to master -> CI checks -> multi-architecture GHCR images
               -> pin tested commit SHA in Git
               -> Argo CD sync -> migration -> API and web rollout
```

The `Test and package` workflow is the required CI gate. After it succeeds on a
push to `master`, `Build and promote`:

1. Builds the API and web images for AMD64 and ARM64.
2. Publishes immutable commit tags and a convenience `main` tag to GitHub
   Container Registry.
3. Replaces both image tags in `deploy/k8s/gitops/kustomization.yaml` with the
   tested commit SHA.
4. Commits that deployment revision to `master` using GitHub's Actions bot.

GitHub does not recursively start workflows for that bot commit. Argo CD sees
the Git change and reconciles it. A newer `master` revision is never replaced by
an older CI run.

The Argo CD application enables automatic sync, pruning, drift self-healing,
retry with backoff, and namespace creation. Resources deploy in this order:

1. Namespace
2. Configuration
3. MySQL Service and StatefulSet
4. Idempotent migration Job
5. API and web Deployments

The migration is an Argo CD sync hook and is deleted after success. A failed
migration stops the later rollout.

Before the first sync, create `app-secrets` outside Git. The existing local
secret can be retained on Docker Desktop. For a new cluster:

```bash
kubectl create namespace like-spotify
kubectl create secret generic app-secrets -n like-spotify \
  --from-literal=MYSQL_PASSWORD='replace-me' \
  --from-literal=MYSQL_ROOT_PASSWORD='replace-me' \
  --from-literal=DATABASE_DSN='like_spotify:replace-me@tcp(mysql:3306)/like_spotify?parseTime=true'
```

For a hosted cluster, manage this Secret with your cloud secret manager and an
operator such as External Secrets. If the GHCR packages are private, also add a
registry pull secret and reference it from the API, migration, and web pod
specifications.

Install Argo CD, wait for it, and bootstrap the application after these files
have been committed and pushed:

```bash
kubectl create namespace argocd
kubectl apply --server-side --force-conflicts -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=Available deployment/argocd-server \
  -n argocd --timeout=300s
kubectl apply -k deploy/argocd
kubectl get applications -n argocd
```

The included Application targets the in-cluster Kubernetes API and the
`like-spotify` namespace. The current GitOps overlay is configured for the
Docker Desktop URL, `http://localhost:8080`. Change its ConfigMap patch and add
the Gateway template before using it on a public HTTPS domain.

## Kubernetes

The local overlay includes a single-replica MySQL StatefulSet for learning and development. For a hosted deployment, use a managed MySQL service and object storage for media, then remove the in-cluster database resources.

Create local secrets without committing them:

```bash
cp deploy/k8s/local/secrets.env.example deploy/k8s/local/secrets.env
# Replace the example passwords and keep DATABASE_DSN in sync.
kubectl apply -k deploy/k8s/local
```

Load or publish the `like-spotify-api:local` and `like-spotify-web:local` images so they are visible to your cluster. Then run the migration Job before rolling out a release:

```bash
kubectl apply -f deploy/k8s/migration-job.yaml
kubectl wait --for=condition=complete job/migrate-v1 -n like-spotify --timeout=180s
kubectl apply -k deploy/k8s/local
kubectl port-forward -n like-spotify service/web 8080:8080
```

For production:

- Build immutable images and reference them by commit SHA or digest.
- Set `APP_ENV=production`, an HTTPS `APP_ORIGIN`, and `COOKIE_SECURE=true`.
- Store secrets in your cloud secret manager and synchronize them into Kubernetes.
- Configure backups and verify restores before relying on any database.
- Install a Gateway API controller, update `deploy/k8s/gateway.example.yaml`, and provide a TLS certificate.
- Run the versioned migration Job once before deploying the matching API image.

## Security model

- Prepared statements for all database values
- Bcrypt password hashes
- Opaque, hashed session tokens stored in MySQL
- HTTP-only, SameSite cookies and per-session CSRF tokens
- Same-origin checks for mutations
- Playlist ownership checks in database queries
- Strict JSON decoding, request-size limits, timeouts, and basic rate limits
- Non-root, read-only application containers with dropped Linux capabilities
- Restricted Pod Security admission, disabled service-account tokens, and default-deny network policies
- Strict browser security headers, including CSP, frame denial, permissions policy, and cross-origin isolation
- CI checks for known dependency vulnerabilities, leaked secrets, and deployment misconfigurations
- AI outputs constrained by a schema and validated against the catalog

The in-memory rate limiter is intended for this project-sized deployment. A larger multi-replica public service should use a shared limiter at the gateway or in Redis.

## Catalog and licensing

The bundled demo tracks are identified in the original project as Bensound music. Review the applicable music and artwork licenses before making a public or commercial deployment.
