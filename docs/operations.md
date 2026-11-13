# Operations

## Health and logs

The frontend is the only application service. Its health endpoint is
`/health/web`; Compose/test uses <http://localhost:8080/health/web> and the
production rehearsal uses <http://localhost:8083/health/web>.

```bash
docker compose ps
docker compose logs --tail=200 web
kubectl get application bedlam-like-music-test -n argocd-test
kubectl get deployment,pod,svc -n bedlam-like-music-test
kubectl rollout status deployment/web -n bedlam-like-music-test
kubectl logs deployment/web -n bedlam-like-music-test --tail=200
```

Repeat with the production namespaces when diagnosing that environment.
There is no application API readiness check or migration job.

## Browser data

Samples/albums/mixer settings are in IndexedDB; theme and patches use
localStorage. Each browser origin is separate. They are not on Kubernetes
volumes and do not synchronize between environments. Preserve original media
and save takes before navigating away. Clearing site data can erase the library.
A complete project backup/export workflow is not implemented.

## Backend retirement and retained data

The source no longer starts the old player API, database, or migration jobs.
No live resources or data are deleted by editing this repository.

When the reviewed revision is delivered, Argo prunes obsolete workloads and
configuration. Existing StatefulSet claims normally remain when its workload
is removed; verify retention policies and owner references before the first
retirement sync, especially if live settings were customized.

The existing `media` PVC remains explicitly declared in the test/production
overlays with `Prune=false,Delete=false`. This one legacy safeguard prevents an
automatic GitOps prune from discarding old media. It is not mounted by the app.
On a fresh installation it may remain Pending because no workload consumes it.
Removing this safeguard or deleting any retained claims requires a separate data
review and verified backup. Do not delete namespaces or reset the cluster to clean up.

Old Compose containers, named volumes, local credentials, and `assets/` or
`media-backup/` directories are untouched. Do not use `down --volumes`,
`--remove-orphans`, or volume pruning as part of this source migration.
Retired credentials remain ignored locally and should be handled separately.

## Rollback and delivery

Prefer reverting a bad source change and delivering the reviewed revision.
Argo owns the desired state; manual image patches will be reversed by self-heal.

```bash
kubectl rollout history deployment/web -n bedlam-like-music-test
kubectl get events -n bedlam-like-music-test --sort-by=.lastTimestamp
```

Rolling back across backend retirement can restart old services and reconnect
retained data. Review those resources before reverting to a legacy revision.

## Troubleshooting

- ImagePullBackOff: verify the frontend SHA tag and GHCR pull credentials.
- Missing recordings/previews: inspect microphone permission and frontend CSP.
- Empty library: check the browser, hostname, and port used to save it.
- Argo ComparisonError: verify the GitOps branch exists and its overlay renders.
- Argo UI unavailable: inspect argocd-server and argocd-local in its namespace.
- Removed API/media paths return 404 by design.

See [Argo CD](argo-cd.md), [observability](observability.md), and the
[production readiness template](production-readiness-template.md).
