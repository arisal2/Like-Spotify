# Documentation

Use this page as the entry point for operating and changing Bedlam-Like-Music.

| Guide                                                    | Use it when you need to…                                       |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| [Bedlam-Like-Music Studio PRD](bedlam-like-music-prd.md) | review future product scope before roadmap and OKRs            |
| [Project management](project/README.md)                  | review roles, tasks, status, and Producer decisions            |
| [Architecture](architecture.md)                          | understand components, trust boundaries, data, and AI behavior |
| [Development](development.md)                            | run services, tests, builds, and browser checks locally        |
| [API reference](api.md)                                  | integrate with or debug HTTP endpoints                         |
| [Operations](operations.md)                              | inspect health, logs, backups, recovery, and rollbacks         |
| [Argo CD](argo-cd.md)                                    | install the local Kubernetes and Argo CD deployment            |
| [GitHub Actions](github-actions.md)                      | configure CI, promotion, and branch protection                 |
| [Deployment environments](deployment-environments.md)    | promote immutable staging releases into protected production   |
| [Security policy](../SECURITY.md)                        | report vulnerabilities and review the deployment baseline      |

## Choose a path

- First local run: [README quick start](../README.md#quick-start-with-docker) →
  [development guide](development.md).
- First cluster deployment: [Argo CD guide](argo-cd.md) →
  [GitHub Actions guide](github-actions.md).
- Incident or failed rollout: [operations guide](operations.md) → relevant
  workflow or Argo troubleshooting section.
- API change: [API reference](api.md) → server routes in
  `backend/internal/httpapi/server.go` → integration tests.

Documentation must describe checked-in behavior. Update the relevant guide in
the same pull request when commands, environment variables, endpoints,
deployment behavior, or operational procedures change.

## Local deployment map

Use these guides in order for a new machine:

1. [Development](development.md) to validate tools, tests, and manifest
   rendering.
2. [GitHub Actions](github-actions.md) to configure repository permissions and
   the required branch-protection check.
3. [Argo CD](argo-cd.md) to install the controller, create runtime secrets,
   bootstrap the application, import media, and verify persistent endpoints.
4. [Operations](operations.md) for routine health checks, backups, rollback,
   and incident diagnosis.

`deploy/k8s/local` is a manual pre-merge smoke-test overlay.
`deploy/k8s/gitops` on `deploy/local` is the desired state used by Argo CD.
Do not operate both as competing deployment methods.
