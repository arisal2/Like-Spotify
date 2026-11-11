# Deployment environments

The approved local topology is one Docker Desktop cluster with three nodes.

| Purpose              | Node                    | Application namespace          | Argo CD namespace   | Source branch | Deployment branch   |
| -------------------- | ----------------------- | ------------------------------ | ------------------- | ------------- | ------------------- |
| Control plane        | `desktop-control-plane` | —                              | —                   | —             | —                   |
| Test                 | `desktop-worker`        | `bedlam-like-music-test`       | `argocd-test`       | `development` | `deploy/test`       |
| Production rehearsal | `desktop-worker2`       | `bedlam-like-music-production` | `argocd-production` | `master`      | `deploy/production` |

Both workers have a `bedlam.io/environment` label and matching `NoSchedule`
taint. Every application Deployment, StatefulSet, and migration Job has a
matching node selector and toleration. The media-import utility targets test.
Namespaces are created by bootstrap, not by either Argo CD instance.

Each namespace-scoped Argo CD instance has a RoleBinding only in its own
application namespace. Application projects further restrict resource kinds
and repository access. Neither instance receives cluster-admin privileges.

Run `bash scripts/bootstrap-cluster.sh` to reproduce the node assignments,
namespaces, pinned Argo CD installation, and RBAC. See [Argo CD](argo-cd.md)
for application activation after the workflows have been published.

## Limits of this topology

This is a local production-workflow rehearsal, not a highly available hosted
production service. The control plane, workers, storage, and host share failure
modes. Each environment has one worker and one database replica. Local-path
volumes remain on their assigned node. Back up both environments separately.

The local production overlay uses HTTP at `localhost:8083` and disables secure
cookies for that loopback workflow. Enable TLS and secure cookies before any
external deployment. Do not expose this configuration publicly.

NetworkPolicy manifests remain in place, but do not treat them as enforced
isolation until the cluster networking implementation has been verified with
cross-namespace connectivity tests. Worker placement and RBAC do not isolate
network traffic.
