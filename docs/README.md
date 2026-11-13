# Documentation

## Use the studio

- [Studio guide](studio.md): synthesis, samples, sound matching, and theory.
- [Quick start](development.md#run-the-studio): run the app with Docker Compose.

## Build and understand

- [Development and testing](development.md): local tools, services, and checks.
- [Architecture](architecture.md): browser audio, local storage, and frontend deployment.
- [Project notes](project/README.md): roles and decisions; older task entries may describe previous product directions.

## Deploy and operate

- [Argo CD setup](argo-cd.md): bootstrap the local cluster and activate applications.
- [GitHub Actions and GitOps](github-actions.md): CI, image selection, and promotion.
- [Deployment environments](deployment-environments.md): test and production-rehearsal topology.
- [Observability](observability.md): local Prometheus, Grafana, and health probes.
- [Operations](operations.md): health checks, backups, and recovery.
- [Production readiness template](production-readiness-template.md): questions for a future external deployment.
- [Security policy](../SECURITY.md): security guidance and reporting.

The `deploy/k8s/local` overlay is a manual smoke-test option. The normal local GitOps path uses `deploy/test` and `deploy/production`, each reconciled by its own Argo CD instance. The production environment is a local rehearsal, not a hosted production service.
