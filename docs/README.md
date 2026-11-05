# Documentation

Use this page as the entry point for operating and changing Like.

| Guide                                     | Use it when you need to…                                       |
| ----------------------------------------- | -------------------------------------------------------------- |
| [Product suite PRD](product-suite-prd.md) | review future product scope before roadmap and OKRs            |
| [Architecture](architecture.md)           | understand components, trust boundaries, data, and AI behavior |
| [Development](development.md)             | run services, tests, builds, and browser checks locally        |
| [API reference](api.md)                   | integrate with or debug HTTP endpoints                         |
| [Operations](operations.md)               | inspect health, logs, backups, recovery, and rollbacks         |
| [Argo CD](argo-cd.md)                     | install the local Kubernetes and Argo CD deployment            |
| [GitHub Actions](github-actions.md)       | configure CI, promotion, and branch protection                 |
| [Security policy](../SECURITY.md)         | report vulnerabilities and review the deployment baseline      |

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
