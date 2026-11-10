# GitHub Actions and GitOps

## Branch and promotion model

```text
feature → PR → development → CI → changed images → deploy/test → test Argo CD
                   │
                   └── verified in test → PR → main → CI → production approval
                                                        → deploy/production
                                                        → production Argo CD
```

`development` and `main` are source branches. `deploy/test` and
`deploy/production` are automation-owned desired-state branches. Retain
`master` until migration is complete; creating the new branches does not
publish uncommitted workflow changes.

## Required repository configuration

Before enabling delivery:

1. Publish the reviewed workflow changes to both source branches and set the
   GitHub default branch to `main`. `workflow_run` workflows must exist on the
   default branch to run.
2. Protect `development` and `main`: require pull requests and `ci-gate`, block
   force pushes and deletion, and restrict bypass permissions.
3. Create the GitHub environment `production`, require a reviewer, prevent
   self-review, and restrict permitted deployment branches to `main`. An
   `environment:` declaration alone does not configure reviewers.
4. Allow the delivery workflows to write repository contents and GHCR packages.
   Make the image packages readable by the cluster, or configure pull secrets
   separately in each application namespace.
5. Merge to `development`, verify test reconciliation and smoke tests, then
   promote the same source tree to `main` through a reviewed PR.

GitHub-hosted runners do not need network access to Docker Desktop. They push
images and Git state; local Argo CD pulls both. The production reviewer must
verify the exact test GitOps revision is Synced and Healthy and that smoke
tests pass. CI success alone does not attest to local cluster health.

## Checks and build selection

CI selects Go, frontend, browser, Kubernetes, and security checks by changed
paths. Browser tests run Go and Vite natively with a MySQL service and a
generated WAV file; they do not require Compose image builds. Container
validation runs on affected pull requests. Post-merge delivery builds and
publishes affected components after CI succeeds.

Delivery compares the source with `.delivery-source` on the last successful
`deploy/test` revision. This covers multiple commits and changes from earlier
failed or superseded runs. A missing baseline builds both images. Every
successful source revision is recorded, even when existing images are reused.

| Change                                                | Publication work                        |
| ----------------------------------------------------- | --------------------------------------- |
| Backend only                                          | Build API; reuse deployed web tag       |
| Frontend only                                         | Build web; reuse deployed API tag       |
| Documentation only                                    | Reuse both images; record tested source |
| Deployment only                                       | Reuse images; update manifests          |
| Build workflow, build scripts, or Docker ignore rules | Rebuild both images                     |

The Docker Desktop nodes are ARM64. Delivery uses a native ARM64 runner and
publishes `linux/arm64`, avoiding a second architecture build and emulation.
PR image validation uses AMD64 with a separate cache. Restore multi-architecture
publication when an actual AMD64 deployment target is introduced.

Dependency layers and GitHub Actions BuildKit caches are retained. Production
promotion does not rebuild: it copies the exact test image tags. These are full
source-commit tags, not cryptographically immutable digest pins; do not overwrite
published SHA tags. Digest-based promotion remains a hardening follow-up.

No before/after build-duration benchmark has been collected. The changes remove
specific duplicated work; elapsed-time improvements need measurement after the
updated workflows run.

## Production promotion

A successful push CI run on `main` starts promotion through the `production`
environment. The job refuses promotion unless the current main tree equals the
source recorded in the selected test revision. It captures that test GitOps
revision, copies its image set, validates manifests, and rejects a stale main
revision before pushing. Moving test ahead of main can require retesting the
intended source; the workflow does not silently select an older test revision.

Manual recovery is available through **Promote production** on `main`, with
`test_gitops_sha` set to the verified current head of `deploy/test`. The same
source-equality and environment rules apply.

A workflow-level concurrency group serializes each environment's writes.
Git pushes remain non-forced. Production approval rules and a successful live
smoke test are required before treating this as operational delivery.
