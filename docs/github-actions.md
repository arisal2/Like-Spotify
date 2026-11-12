# GitHub Actions and GitOps setup

This repository is a local deployment-practice lab with two source branches and
two automation-owned GitOps branches:

```text
feature → PR → development → CI → deploy/test → test Argo CD
                    │
                    └── verify test → PR → master → CI → deploy/production
                                                        → production-rehearsal Argo CD
```

| Source branch | GitOps branch       | Kustomize overlay       | Local endpoint          |
| ------------- | ------------------- | ----------------------- | ----------------------- |
| `development` | `deploy/test`       | `deploy/k8s/test`       | `http://localhost:8080` |
| `master`      | `deploy/production` | `deploy/k8s/production` | `http://localhost:8083` |

`deploy/test` and `deploy/production` are automation-owned desired-state
branches. Do not develop or merge feature work directly into them.

## Required repository configuration

1. Protect `development` and `master`: require pull requests and the
   `ci-gate` check; block force pushes and deletion.
2. Allow Actions to write repository contents and GHCR packages so delivery
   can update the two GitOps branches.
3. Do not protect the GitOps branches in a way that blocks
   `github-actions[bot]`; prohibit ordinary direct pushes instead.
4. Make GHCR packages readable from Docker Desktop, or configure scoped image
   pull secrets for both application namespaces.

## Delivery behavior

After a successful push CI run, delivery compares the source revision with the
`.delivery-source` marker in that environment’s last GitOps revision. It builds
only API or web images whose source changed; unchanged components retain their
previous immutable commit-SHA tag. Each delivery writes the complete desired
state and records the tested source revision.

The Docker Desktop workers are ARM64. Delivery uses an ARM64 runner and
publishes `linux/arm64` images. Pull-request container validation remains a
separate AMD64 build check.

## Before the next feature

1. Merge feature work into `development`.
2. Confirm `deploy/test` is Synced and Healthy in test Argo CD, then smoke-test
   `http://localhost:8080`.
3. Merge the reviewed change from `development` into `master`.
4. Confirm `deploy/production` is Synced and Healthy in production-rehearsal
   Argo CD, then smoke-test `http://localhost:8083`.

CI success verifies the build and tests; it does not by itself verify local
Argo reconciliation. Use the application and endpoint checks above.

## Browser test selection

Synth-only and sample-studio-only changes run their selected Chromium journeys
against Vite without starting the Go API or MySQL. Changes to both run both
journeys; changes to the shared studio shell also run both. Other shared
frontend files, backend code, workflow configuration, and
unknown frontend paths fall back to the full browser suite with its existing
API and database setup. Pull requests to `master` always run that full suite.
Frontend changes still run the complete unit suite, lint, and build. The
`ci-gate` requires every selected job to succeed, including the selected
browser job; a skipped selected job fails the gate.

Maintain the explicit paths and tests in `scripts/select-studio-tests.sh` and
`scripts/test-select-studio-tests.sh` when adding or moving studio files. New
paths default to the full suite until deliberately classified.

## Dependency protection

Pull requests run dependency review, npm audit, `govulncheck`, and Trivy.
Dependabot tracks Go, npm, Docker, and GitHub Actions dependencies. The two
official MIT-licensed Actions with missing dependency-graph license metadata
are package-specific exceptions; do not broaden that allow-list.
