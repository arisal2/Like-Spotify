# Staging and production delivery

The repository separates verification, image publication, environment
promotion, and cluster reconciliation. An image is built once from tested
`master`; production receives the exact image tags already exercised by
staging.

```text
pull request → CI gate → master CI → publish immutable images
                                      ├─ deploy/local → local Argo CD
                                      └─ deploy/staging → staging Argo CD

approved deploy/staging SHA → production environment approval
                            → deploy/production → production Argo CD
```

## Environment contract

| Environment | Git branch          | Kustomize path          | Namespace                      | Promotion              |
| ----------- | ------------------- | ----------------------- | ------------------------------ | ---------------------- |
| Local       | `deploy/local`      | `deploy/k8s/gitops`     | `bedlam-like-music`            | Automatic after master |
| Staging     | `deploy/staging`    | `deploy/k8s/staging`    | `bedlam-like-music-staging`    | Automatic after master |
| Production  | `deploy/production` | `deploy/k8s/production` | `bedlam-like-music-production` | Approved manual action |

The deployment branches are automation-owned. Never merge feature work into
them. API and web tags are immutable source commit SHAs; unchanged components
retain their previously tested tags.

## Required GitHub configuration

1. Create a GitHub Environment named `production`.
2. Add required reviewers and prevent administrators from bypassing approval.
3. Protect `master` and require the `ci-gate` check.
4. Enable the dependency graph, Dependabot alerts, and Dependabot security
   updates under **Settings → Code security**.
5. Allow Actions to update `deploy/local`, `deploy/staging`, and
   `deploy/production`, while preventing direct human pushes.

The production workflow accepts the exact head SHA of `deploy/staging`. It
fails if staging moved, either image is not pinned to a full commit SHA, or the
manifests do not render.

## Cluster bootstrap

Create separate `app-secrets` in each namespace before applying the Argo
applications. Never reuse staging credentials in production. Prefer External
Secrets or SOPS with an external KMS for remote clusters; checked-in manifests
intentionally contain no credentials.

```bash
kubectl apply -k deploy/argocd/environments
kubectl get applications -n argocd
```

Replace the example origins before deployment:

- staging: `https://staging.music.example.com`
- production: `https://music.example.com`

Configure platform ingress or Gateway, TLS certificates, and DNS for those
origins. The application service should be the only public workload endpoint;
never expose MySQL publicly.

## Production readiness gate

The overlays make promotion repeatable, but serving real user data also
requires:

- managed or independently backed-up MySQL;
- object storage or backed-up persistent media;
- external secret management and key rotation;
- ingress/Gateway rate limits, TLS, and DNS;
- verified database and media restore drills;
- observability, alert routing, and rollback exercises;
- staging smoke tests against the actual public endpoint.

Until these controls exist, treat production as a protected promotion scaffold,
not authorization to serve real user data.

## Promote production

After staging is healthy, obtain its exact GitOps commit SHA:

```bash
git ls-remote origin refs/heads/deploy/staging
```

Run **Promote production**, provide that SHA, and approve the `production`
environment gate. Argo CD then reconciles `deploy/production`. Roll back by
promoting a previously healthy staging state or reverting the production
GitOps commit; do not keep manual workload patches.

## Dependency alerts

Pull requests run GitHub dependency review and block newly introduced High or
Critical vulnerabilities. Existing code is also checked by npm audit,
`govulncheck`, Trivy, and Dependabot alerts.

The license review has package-specific exceptions for the official
`actions/checkout` and `azure/setup-kubectl` actions because the dependency
graph currently reports their metadata as unknown. Both upstream projects
declare MIT licenses; do not broaden these exceptions to other packages.

The November 2026 review found `GO-2026-5932` in `golang.org/x/crypto`. The
application did not call the vulnerable packages, but the module was upgraded
to the first fixed revision so the alert can close without an ignore rule.
