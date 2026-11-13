# GitHub Actions and GitOps setup

Two source branches feed separate automation-owned deployment branches:

```text
feature → development → CI → deploy/test → test Argo CD
              └── reviewed promotion → master → CI → deploy/production
                                                   → production-rehearsal Argo CD
```

| Source      | GitOps branch     | Overlay               |
| ----------- | ----------------- | --------------------- |
| development | deploy/test       | deploy/k8s/test       |
| master      | deploy/production | deploy/k8s/production |

## Repository setup

1. Protect development and master with PRs and the required `ci-gate`.
2. Allow Actions repository-content and GHCR writes for delivery.
3. Permit the automation bot to update GitOps branches; do not develop there.
4. Make the frontend GHCR package readable, or configure pull credentials in
   both application namespaces.
5. Review [Argo CD activation](argo-cd.md) and existing-volume retention before
   deploying the backend-retirement revision.

## Selected checks

Frontend changes run lint, Node unit tests, build, and npm audit. Explicit studio
paths select focused browser journeys against Vite. Shared/unknown frontend
paths and PRs to master run all journeys against nginx, including the native
fake-device recording smoke. Neither browser path starts an API or database.

Kubernetes changes render all application/Argo/observability overlays.
Configuration security scans use Trivy; PRs also run dependency review.
Documentation changes check Markdown formatting. The gate rejects a selected
check that was skipped or failed.

Keep `scripts/select-studio-tests.sh` and its tests current when files move.
The full nginx browser job mounts the built assets/config into an unprivileged
nginx container, avoiding another Node image build just to run browser tests.

## Image selection and promotion

Only the web image is published. Delivery compares the source to the environment's
last `.delivery-source` marker; `web/` or `.dockerignore` changes build a new
image. Documentation, manifests, and workflow-only changes reuse the prior
immutable frontend SHA. A fresh environment builds the frontend image.
Failure to inspect the remote fails delivery rather than guessing its state.

Delivery runs after successful CI on development/master, pins the selected SHA
in the corresponding overlay, records the tested source, and updates its GitOps
branch. Stale runs do not overwrite a newer source revision.
The existing local rehearsal builds changed frontend source independently on
each source branch; it does not guarantee promotion of the identical tested
artifact between branches.

Workers are ARM64: routine delivery uses an ARM64 runner. PR container builds
validate AMD64; tagged releases publish both architectures. API images are no
longer built or required, including when upgrading an old two-image GitOps branch.

## Dependency protection

Dependabot tracks npm, frontend Docker, and GitHub Actions. Go dependency jobs
have been removed with the backend. Preserve npm audit, dependency review, and
Trivy checks. The two official MIT Actions with missing license metadata remain
package-specific exceptions.

CI success is not proof of local Argo health. Check test manually before
promoting to master, using the [environment guide](deployment-environments.md).
