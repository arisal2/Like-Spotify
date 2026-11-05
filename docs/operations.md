# Operations

## Service endpoints

| Check         | Compose/local cluster URL              | Healthy result       |
| ------------- | -------------------------------------- | -------------------- |
| Web           | `http://localhost:8080/health/web`     | `200 ok`             |
| API liveness  | `http://localhost:8081/health/live`    | `{"status":"ok"}`    |
| API readiness | `http://localhost:8081/health/ready`   | `{"status":"ready"}` |
| Catalog path  | `http://localhost:8080/api/v1/catalog` | JSON song list       |
| Argo CD       | `https://localhost:8082`               | login page           |

The readiness endpoint checks MySQL with a two-second timeout. A live but
unready API usually indicates database connectivity or migration trouble.

## Logs and status

### Compose

```bash
docker compose ps
docker compose logs --tail=200 db migrate api web
curl -i http://localhost:8081/health/ready
```

API logs are structured JSON. Use the response `X-Request-ID` to correlate a
client-visible failure with its server log entry.

### Kubernetes

```bash
kubectl get application like-spotify -n argocd
kubectl get pods,jobs,pvc,svc -n like-spotify
kubectl rollout status deployment/api -n like-spotify
kubectl rollout status deployment/web -n like-spotify
kubectl logs deployment/api -n like-spotify --tail=200
kubectl logs statefulset/mysql -n like-spotify --tail=200
kubectl get events -n like-spotify --sort-by=.lastTimestamp
```

### Routine GitOps check

Use this sequence after a merge or when the UI is unavailable:

```bash
git ls-remote origin refs/heads/master refs/heads/deploy/local
kubectl get application like-spotify -n argocd \
  -o custom-columns=SYNC:.status.sync.status,HEALTH:.status.health.status,REVISION:.status.sync.revision
kubectl get deployment,statefulset,pod,job -n like-spotify
kubectl get svc web-local -n like-spotify
```

The `deploy/local` revision and Argo CD's reported revision should converge
after **Build and promote** completes. A healthy cluster can legitimately lag
`master` when the merge changed documentation only or when a newer workflow is
still running.

Avoid editing Argo-managed workloads with `kubectl edit`, `set image`, or
long-lived patches. Self-heal will reverse drift; durable changes belong in Git.

## Data that must survive

- MySQL: accounts, sessions, playlists, likes, mixes, feedback, and history.
- Media: audio and artwork on the bind-mounted directory or `media` PVC.
- Git: desired deployment configuration, but never database credentials or
  licensed media.

## Compose backup and restore

Use an explicit filename outside the repository or under the ignored
`media-backup/` directory. Avoid printing passwords in logs or committing them.

```bash
mkdir -p media-backup
docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers "$MYSQL_DATABASE"' \
  > media-backup/mysql.sql
```

Restore only into the intended database after validating the backup:

```bash
docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$MYSQL_DATABASE"' \
  < media-backup/mysql.sql
```

Back up the directory selected by `MEDIA_PATH` separately. A copy on the same
disk does not protect against disk failure.

## Kubernetes backup and restore

For a small local cluster, create a MySQL dump and copy the media PVC through
the existing import pod pattern. Stop writes or use a consistent dump. Before
any cluster reset, verify that both database and media backups exist outside
Docker Desktop's virtual disk.

Production use should replace manual commands with scheduled, encrypted,
retention-managed backups and automated restore tests.

## Rollback

The delivery workflow writes immutable commit-SHA image tags to `deploy/local`.
Prefer reverting the bad change on `master`; once its checks pass, promotion
produces a new desired state and Argo CD reconciles it.

```bash
argocd app history like-spotify
kubectl rollout history deployment/api -n like-spotify
kubectl rollout history deployment/web -n like-spotify
```

Avoid long-lived manual cluster edits because Argo CD self-heal will revert
them. A manual rollback must be followed by a Git change that makes the desired
state explicit.

## Common failures

- `ImagePullBackOff`: verify GHCR visibility or pull credentials and confirm
  the promoted image tag exists.
- API unready: inspect MySQL readiness, `app-secrets`, `DATABASE_DSN`, and the
  migration hook logs.
- Argo `ComparisonError`: verify `deploy/local` exists and the configured path
  renders with Kustomize.
- Missing media: verify PVC/bind-mount contents and exact catalog filenames.
- Login or mutation returns 403: verify `APP_ORIGIN`, HTTPS termination,
  `COOKIE_SECURE`, and the CSRF header.
- App loads but API returns 502: verify API pods/containers and nginx's `api`
  service resolution.
- Argo CD UI is unavailable: inspect `argocd-server` and `argocd-local` in the
  `argocd` namespace; the persistent endpoint is a LoadBalancer, not a port
  forward.

## Before public exposure

Do not expose the current local endpoints directly to the internet. Add a
production ingress or gateway with TLS, real DNS, secure cookies, external
secret management, shared rate limiting, monitored backups, metrics/traces,
and an incident-response process first.
