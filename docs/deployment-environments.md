# Deployment environments

The approved local topology is one Docker Desktop cluster with three nodes.

| Purpose              | Node                    | Application namespace          | Argo CD namespace   | Source branch | Deployment branch   |
| -------------------- | ----------------------- | ------------------------------ | ------------------- | ------------- | ------------------- |
| Control plane        | `desktop-control-plane` | —                              | —                   | —             | —                   |
| Test                 | `desktop-worker`        | `bedlam-like-music-test`       | `argocd-test`       | `development` | `deploy/test`       |
| Production rehearsal | `desktop-worker2`       | `bedlam-like-music-production` | `argocd-production` | `master`      | `deploy/production` |

Both workers have a `bedlam.io/environment` label and matching `NoSchedule`
taint. Each frontend Deployment has a matching node selector and toleration.
There is no application database or migration workload.
Namespaces are created by bootstrap, not by either Argo CD instance.

Each namespace-scoped Argo CD instance has a RoleBinding only in its own
application namespace. Application projects further restrict resource kinds
and repository access. Neither instance receives cluster-admin privileges.

Run `bash scripts/bootstrap-cluster.sh` to reproduce the node assignments,
namespaces, pinned Argo CD installation, and RBAC. See [Argo CD](argo-cd.md)
for application activation after the workflows have been published.

## Local endpoints

| Service                      | Address                  |
| ---------------------------- | ------------------------ |
| Test app                     | <http://localhost:8080>  |
| Test Argo CD                 | <https://localhost:8082> |
| Production-rehearsal app     | <http://localhost:8083>  |
| Production-rehearsal Argo CD | <https://localhost:8084> |
| Grafana, if installed        | <http://localhost:3000>  |

These addresses require the corresponding services to be running. Compose and
the test cluster both use port 8080; stop one before starting the other. See
[observability](observability.md) for Grafana setup.

## Limits of this topology

This is a local production-workflow rehearsal, not a highly available hosted
production service. The control plane, workers, storage, and host share failure
modes. Each environment has one worker. Retired legacy volumes remain on their
assigned node; browser samples instead belong to their browser origin.

The local production overlay uses HTTP at `localhost:8083`. Use HTTPS for any
external deployment, including browser microphone support. Do not expose this configuration publicly.

NetworkPolicy manifests remain in place, but do not treat them as enforced
isolation until the cluster networking implementation has been verified with
cross-namespace connectivity tests. Worker placement and RBAC do not isolate
network traffic.
