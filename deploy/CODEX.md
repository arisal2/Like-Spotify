# Deployment working context

Read the repository-root `CODEX.md` first.

## Ownership model

- `deploy/k8s/local` is a manual pre-merge smoke-test overlay.
- `deploy/k8s/test` on the automation-owned `deploy/test` branch is the desired
  state reconciled by the Docker Desktop test Argo CD installation.
- Production uses the dedicated second worker in the same Docker Desktop cluster.
  Separate namespace-scoped Argo CD instances manage test and production.
  `development` feeds test; `master` promotes the verified test images without rebuilding.
- CI publishes immutable images; Argo CD deploys declared state. Do not make
  long-lived manual cluster patches.

## Constraints

- Preserve non-root execution, read-only filesystems, dropped capabilities,
  resource limits, health probes, service-account restrictions, and network
  policies.
- Runtime secrets and user audio never belong in manifests or Git.
- A future render worker must be isolated, resource bounded, cancellable, and
  denied unnecessary network and Kubernetes API access.
- Persistent metadata and binary storage require coordinated backup and restore
  verification before Studio data is considered durable.

## Required validation

Render base, local, test, production, and both Argo CD Kustomize configurations
after manifest changes. Document operational, secret, storage, or recovery
changes in the same work item.
