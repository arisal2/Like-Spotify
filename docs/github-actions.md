# GitHub Actions and GitOps setup

The repository uses pull requests for verification and a separate promotion
branch for local deployment:

```text
pull request → checks → merge to master → checks → publish images
             → update deploy/local → Argo CD sync
```

## 1. Configure GitHub

1. In **Settings → Actions → General**, enable Actions and permit the actions
   used by `.github/workflows`.
2. Under **Workflow permissions**, select **Read and write permissions**. The
   delivery workflow needs repository contents write access for `deploy/local`
   and packages write access for GHCR. Workflow YAML still declares the minimum
   permissions it uses.
3. In **Settings → Branches** (or a repository ruleset), protect `master`:
   require a pull request, require approval as appropriate, require branches to
   be up to date if desired, and require the `ci-gate` status check from
   **Test and package**. Do not require every conditional job; unaffected jobs
   are intentionally skipped.
4. Do not apply a rule to `deploy/local` that prevents `github-actions[bot]`
   from updating it, or explicitly allow that automation actor. Never merge
   feature work into this generated branch.
5. Confirm the GHCR packages are accessible from the local cluster. Public
   images require no pull secret; private images need a scoped registry pull
   secret on the API, web, and migration pods.
6. Install the Argo application using the [local cluster guide](argo-cd.md).

No personal GitHub token is required by the checked-in workflow. Do not put
database passwords, AI keys, or media in repository secrets or Git unless they
are explicitly needed by a workflow.

After saving these settings, open a pull request and confirm `ci-gate` appears
as the required check before relying on the rule. GitHub cannot select a status
check that has never run in the repository.

## 2. Understand the workflows

`Test and package` runs on pull requests, pushes to `master`, and reusable
workflow calls. A change-detection job selects only the checks affected by the
changed paths:

| Changed paths                            | Selected checks                   |
| ---------------------------------------- | --------------------------------- |
| `backend/**`                             | backend, browser, security        |
| `web/**`                                 | frontend, browser, security       |
| `deploy/**`                              | Kubernetes rendering and security |
| workflow or shared runtime configuration | full relevant suite               |
| Markdown only                            | documentation formatting          |

The final `ci-gate` job fails if any selected job fails and accepts jobs that
were intentionally skipped. Make `ci-gate` the required branch-protection
check instead of requiring every component job individually. Reusable workflow
calls, including tagged releases, deliberately run the full suite.

Browser tests generate a temporary WAV tone with Node and exercise native Go,
Vite, and a MySQL service. Production container builds run separately, in
parallel, and only for changed API or web build contexts. This keeps the real
browser/API/database/media flow while removing image builds and Compose startup
from the browser job's critical path.

After a successful **push** run on `master`, `Build and promote` examines the
merged commit. It publishes only changed API or web images for AMD64 and ARM64.
Changed images receive an immutable commit-SHA tag; unchanged components keep
their previously deployed immutable tag. Deployment-only changes update
`deploy/local` without rebuilding images, while documentation-only changes do
not publish or promote anything.

Argo CD watches only `deploy/local`. A stale run checks the current `master`
tip before promotion, and promotion pushes normally without a force update.

Release tags trigger a separate image publishing workflow. Dependabot opens
dependency update PRs; review their changelogs and checks before merging.

## 3. Make a change

1. Create a branch and make your changes.
2. Run the relevant local tests and open a pull request to `master`.
3. Wait for every required check and review to pass, then merge.
4. Watch `Test and package`, followed by `Build and promote`, in the Actions
   tab. A failed check prevents deployment.
5. Confirm Argo sync and workload readiness with the commands in the Argo guide.

For the first deployment, `deploy/local` may not exist until an application or
`deploy/**` change is merged. A docs-only merge intentionally runs no
promotion. Once created, the branch is automation-owned desired state; Argo CD
watches it continuously.

The Docker build stages run on the builder's native architecture. The Go
binary is cross-compiled for each target; the static web bundle is built
natively and reused across image architectures. This avoids running Node and
the Go compiler under emulation while preserving multi-architecture images.

## 4. Troubleshooting

- **Build and promote skipped:** it only promotes successful push runs on
  `master`, not PR runs or failures.
- **Push to `deploy/local` denied:** check `GITHUB_TOKEN` contents permissions
  and branch rules for the automation-owned branch.
- **Image publish denied:** check GHCR package permissions and ownership.
- **Argo revision missing:** promotion must finish before `deploy/local`
  exists. Inspect the promotion job and Argo application conditions.
- **Private images cannot be pulled:** configure a scoped image pull secret;
  GitHub Actions authentication is not automatically available to Kubernetes.
- **A newer change arrived:** the older delivery intentionally skips promotion;
  inspect the newest successful `master` run instead.
- **A component job was skipped:** inspect the `changes` job; path selection is
  expected. The required `ci-gate` job still verifies the selected jobs.
- **An unchanged component kept an older image tag:** this is intentional. Its
  source did not change, so GitOps preserves the previously tested immutable
  image instead of republishing identical content.
