# Deployment working context

Read the repository-root `CODEX.md` first.

## Ownership model

- `deploy/k8s/local` is a manual pre-merge smoke-test overlay.
- `deploy/k8s/gitops` on the automation-owned `deploy/local` branch is the
  desired state reconciled by Argo CD.
- `deploy/staging` is promoted automatically from tested `master`; production
  promotion copies an explicitly approved `deploy/staging` state to the
  protected `deploy/production` branch without rebuilding images.
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

Render base, local, GitOps, and Argo CD Kustomize configurations after manifest
changes. Document operational, secret, storage, or recovery changes in the same
work item.
