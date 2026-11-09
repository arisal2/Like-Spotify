# Local Kubernetes deployment with Argo CD

This guide starts with an empty Docker Desktop Kubernetes cluster and ends with
persistent URLs for the application and Argo CD—no routine port forwarding.

| Service           | URL                      |
| ----------------- | ------------------------ |
| Bedlam-Like-Music | <http://localhost:8080>  |
| Argo CD           | <https://localhost:8082> |

Argo CD reads `deploy/k8s/gitops` from `deploy/local`. GitHub Actions creates
and updates that branch after a successful `master` build, so the cluster pulls
a tested deployment revision instead of deploying from a developer laptop.

## How deployment works

```text
pull request → CI → merge to master → CI → build changed images in GHCR
                                               ↓
                                      update deploy/local
                                               ↓
Docker Desktop cluster ← Argo CD detects and syncs the desired state
```

Docker Desktop publishes the two LoadBalancer services on the host. That is why
the endpoints remain available without `kubectl port-forward`.

## 1. Prerequisites

- Docker Desktop with Kubernetes enabled.
- `kubectl`, Git, and repository access.
- A successful promotion so `deploy/local` and its GHCR images exist.
- Licensed audio and artwork if media playback is required.

The Argo CD CLI is optional; bootstrap uses `kubectl`.

Confirm the target before changing anything:

```bash
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl cluster-info
kubectl get nodes
```

Stop if the current context is not `docker-desktop`.

## 2. Verify the deployment branch

```bash
git ls-remote --exit-code --heads origin refs/heads/deploy/local
git fetch origin deploy/local
git show origin/deploy/local:deploy/k8s/gitops/kustomization.yaml
```

The image `newTag` values should be full commit SHAs, not `main`. If the branch
does not exist, merge an application or deployment change into `master`, then
wait for **Test and package** and **Build and promote**. Documentation-only
merges do not promote because no runtime component changed.

## 3. Install Argo CD

The local setup is documented against pinned Argo CD `v3.6.0`. Review upstream
upgrade notes before changing it.

```bash
kubectl create namespace argocd
kubectl apply -n argocd --server-side --force-conflicts \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/v3.6.0/manifests/install.yaml
kubectl wait --for=condition=Available deployment/argocd-server \
  -n argocd --timeout=300s
kubectl get pods -n argocd
```

This official non-HA install is suitable for a single-node development cluster,
not production. The versioned URL prevents an unexpected future upgrade.

## 4. Create runtime secrets

GitOps intentionally contains no credentials. Create the namespace and Secret
before the first successful sync:

```bash
kubectl create namespace bedlam-like-music --dry-run=client -o yaml | kubectl apply -f -
kubectl create secret generic app-secrets -n bedlam-like-music \
  --from-literal=MYSQL_PASSWORD='<app-password>' \
  --from-literal=MYSQL_ROOT_PASSWORD='<root-password>' \
  --from-literal=DATABASE_DSN='bedlam_like_music:<app-password>@tcp(mysql:3306)/bedlam_like_music?parseTime=true'
```

`MYSQL_PASSWORD` and the password in `DATABASE_DSN` must match. Use a DSN-safe
password or percent-encode reserved characters. Do not commit real values or
leave them in shared shell history.

Optional AI settings can be included as `OPENAI_API_KEY` and `OPENAI_MODEL`.
Recreate the complete Secret with `--dry-run=client -o yaml | kubectl apply -f -`
when adding keys; do not print the existing Secret. Production deployments
should use an encrypted or external secret workflow.

## 5. Handle private GHCR packages

Skip this section when the API and web packages are public. Private packages
need a read-only GitHub package token:

```bash
kubectl create secret docker-registry ghcr-pull -n bedlam-like-music \
  --docker-server=ghcr.io \
  --docker-username='<github-user>' \
  --docker-password='<read-packages-token>'
```

The current workloads do not reference `ghcr-pull` automatically. Add
`imagePullSecrets` to the service account or pod specifications in Git and let
the promotion workflow update `deploy/local`. Do not rely on a permanent,
undocumented cluster-only patch.

## 6. Bootstrap the Argo CD application

Run from the repository root:

```bash
kubectl kustomize deploy/argocd
kubectl apply -k deploy/argocd
kubectl get appproject,application -n argocd
```

This installs:

- `AppProject/bedlam-like-music`, restricting source, destination, and resource
  types.
- `Application/bedlam-like-music`, watching `deploy/local` at
  `deploy/k8s/gitops` with automatic sync, pruning, and self-healing.
- `Service/argocd-local`, publishing Argo CD on host port 8082.

Wait for reconciliation:

```bash
kubectl get application bedlam-like-music -n argocd -w
kubectl get pods,jobs,pvc,svc -n bedlam-like-music
```

Stop the watch after Sync is `Synced` and Health is `Healthy`. The first sync
can take several minutes while Docker Desktop downloads images.

## 7. Import media

The GitOps overlay creates a `media` PVC and mounts it read-only in the API.
After it is Bound, copy permitted media through the disposable import pod:

```bash
kubectl wait --for=jsonpath='{.status.phase}'=Bound \
  persistentvolumeclaim/media -n bedlam-like-music --timeout=180s
kubectl apply -f deploy/k8s/media-import.yaml
kubectl wait --for=condition=Ready pod/media-import \
  -n bedlam-like-music --timeout=180s
kubectl cp assets/. bedlam-like-music/media-import:/media
kubectl delete pod media-import -n bedlam-like-music
```

Expected paths are `music/` and `images/artwork/`, with filenames from
`backend/internal/catalog/songs.json`. Keep a backup outside Docker Desktop;
resetting its cluster can destroy local volumes.

## 8. Sign in and verify

Open <https://localhost:8082>. The initial username is `admin`. Retrieve the
one-time password without writing it to disk:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 --decode
printf '\n'
```

Change it after signing in. The local generated certificate may cause a browser
warning.

Verify both persistent endpoints:

```bash
kubectl get svc web-local -n bedlam-like-music
kubectl get svc argocd-local -n argocd
curl --fail http://localhost:8080/health/web
curl --fail http://localhost:8080/api/v1/catalog
```

The API is reached through the web service at `/api`; it is not independently
published by the GitOps overlay.

## 9. Deploy future changes

Normal releases use GitOps, not `kubectl set image`:

1. Open a feature-branch pull request to `master`.
2. Wait for the required `ci-gate` and review, then merge.
3. Wait for the `master` **Test and package** run.
4. Wait for **Build and promote** to publish changed images and update
   `deploy/local`.
5. Watch Argo CD sync the branch revision.

```bash
kubectl get application bedlam-like-music -n argocd -w
kubectl rollout status deployment/api -n bedlam-like-music --timeout=300s
kubectl rollout status deployment/web -n bedlam-like-music --timeout=300s
```

Unchanged components retain their immutable tags. Documentation-only changes
publish no image and produce no cluster promotion.

## Manual pre-merge smoke test

This path renders and applies local manifests before a merge. It is not a
replacement for Argo CD and uses local image names:

```bash
cp deploy/k8s/local/secrets.env.example deploy/k8s/local/secrets.env
# Edit secrets.env; MYSQL_PASSWORD and the DSN password must match.
kubectl apply -k deploy/k8s/local
kubectl apply -f deploy/k8s/migration-job.yaml
```

First build images named `bedlam-like-music-api:local` and
`bedlam-like-music-web:local` into Docker Desktop's image store. Never commit
`deploy/k8s/local/secrets.env`; Git ignores it. Remove manually applied
resources before returning to the GitOps deployment to avoid ownership
confusion.

## Upgrade Argo CD

1. Read release and upgrade notes from the installed version to the target.
2. Confirm desired configuration is in Git and data backups are current.
3. Apply the target's pinned official install manifest.
4. Wait for all Argo deployments and verify Bedlam-Like-Music remains Synced and Healthy.
5. Update the pinned version in this guide in the same pull request.

```bash
kubectl get deploy -n argocd
kubectl get application bedlam-like-music -n argocd
```

## Troubleshooting

### Revision not found

Confirm remote `deploy/local` exists and **Build and promote** succeeded. A
documentation-only merge does not create a promotion.

### Application is OutOfSync or Degraded

```bash
kubectl describe application bedlam-like-music -n argocd
kubectl get events -n bedlam-like-music --sort-by=.lastTimestamp
kubectl get pods,jobs -n bedlam-like-music
```

Inspect the first failing resource rather than repeatedly forcing a sync.

### ImagePullBackOff

Check the exact SHA tag in `deploy/local`, GHCR visibility, node architecture,
and configured pull credentials.

### Migration failed

```bash
kubectl get jobs -n bedlam-like-music
kubectl logs job/migrate -n bedlam-like-music
kubectl describe secret app-secrets -n bedlam-like-music
```

Do not print Secret values. Confirm that the database password and DSN agree.

### Local endpoints do not open

```bash
kubectl get svc web-local -n bedlam-like-music
kubectl get svc argocd-local -n argocd
kubectl describe svc web-local -n bedlam-like-music
```

Both services should be `LoadBalancer`. If the external address stays pending,
confirm Docker Desktop Kubernetes supports LoadBalancer services. Port
forwarding can diagnose the service but should not be required normally.

### Media is missing

Confirm the `media` PVC is Bound and inspect the import pod and exact catalog
filenames. Argo CD manages the PVC declaration, not its content.

## Teardown

Export database and media backups first. The Application has a resources
finalizer, so deleting it can prune managed resources.

```bash
kubectl delete -k deploy/argocd
kubectl delete namespace bedlam-like-music
kubectl delete namespace argocd
```

This can delete MySQL and media PVC data. Git and GHCR can recreate workloads,
but cannot recreate user data or media.

## Production boundary

This setup is for a trusted local machine. Before internet exposure, use a
production ingress or gateway, real DNS and TLS, secure cookies, external
secrets, SSO and restricted Argo access, enforced network policies, monitored
encrypted backups, and an incident-response process.

## References

- [Argo CD getting started](https://argo-cd.readthedocs.io/en/latest/getting_started/)
- [Argo CD releases](https://github.com/argoproj/argo-cd/releases)
- [GitHub Actions and GitOps setup](github-actions.md)
- [Operations and recovery](operations.md)
