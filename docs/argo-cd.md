# Argo CD on the three-node Docker Desktop cluster

Two Argo CD instances manage separate application namespaces and workers. This
uses the official namespace-scoped install, with shared CRDs installed once.
See the [upstream installation guide](https://argo-cd.readthedocs.io/en/stable/operator-manual/installation/).

## Bootstrap

Requirements: the three Ready Docker Desktop nodes, `kubectl`, `curl`, and Bash.

```bash
kubectl config current-context  # must be docker-desktop
kubectl get nodes
bash scripts/bootstrap-cluster.sh
```

The script pins Argo CD to `v3.6.0`, labels and taints both workers, creates
namespaces, installs both instances, and grants each instance access to only
its application namespace. It does not activate application reconciliation.

```bash
kubectl get pods -n argocd-test -o wide
kubectl get pods -n argocd-production -o wide
kubectl auth can-i create deployments -n bedlam-like-music-production \
  --as=system:serviceaccount:argocd-test:argocd-application-controller
# Expected: no
```

| Interface                                | Local URL after LoadBalancer provisioning |
| ---------------------------------------- | ----------------------------------------- |
| Test Argo CD                             | <https://localhost:8082>                  |
| Production Argo CD                       | <https://localhost:8084>                  |
| Test application, after activation       | <http://localhost:8080>                   |
| Production application, after activation | <http://localhost:8083>                   |

Inspect `kubectl get service argocd-local -n argocd-test` if the endpoint is not
available. Docker Desktop must finish provisioning its LoadBalancer. For
troubleshooting, use `kubectl port-forward -n argocd-test svc/argocd-server
8082:443` (or production on port 8084).

Login uses `admin` and the generated initial password. Retrieve it locally;
do not put it into Git, screenshots, or logs:

```bash
kubectl get secret argocd-initial-admin-secret -n argocd-test \
  -o jsonpath='{.data.password}' | base64 --decode; printf '\n'
```

Each instance has a different password. Use username `admin` and the decoded
password from the namespace matching the URL. The trailing newline prevents
zsh's `%` prompt marker from appearing beside the password; that marker is not
part of the password.

On macOS, copy the test password directly without displaying it:

```bash
kubectl --context docker-desktop get secret argocd-initial-admin-secret -n argocd-test \
  -o jsonpath='{.data.password}' | base64 --decode | pbcopy
```

Paste it into <https://localhost:8082>. For <https://localhost:8084>, repeat
with `argocd-production`. The initial local HTTPS certificate is self-signed;
the browser may require accepting that certificate before showing the login
page. Rotate both passwords after initial login.

## Activate applications

First publish and configure the [CI/CD workflows](github-actions.md). Verify
`deploy/test` contains the reviewed three-node manifests and full SHA image
tags; an old deployment branch may contain a different topology.

Create separate `app-secrets` Secrets in `bedlam-like-music-test` and
`bedlam-like-music-production`. Each needs `MYSQL_PASSWORD`,
`MYSQL_ROOT_PASSWORD`, and `DATABASE_DSN`. The DSN format is:

```text
bedlam_like_music:<environment-password>@tcp(mysql:3306)/bedlam_like_music?parseTime=true
```

Use distinct generated passwords. Create Secrets from a protected local file
or a secret manager, and never commit that file. For private GHCR packages,
configure image-pull credentials in each environment before synchronization.

```bash
kubectl apply -k deploy/argocd
kubectl get application -n argocd-test
```

After test is Synced and Healthy, check the studio, synth playback, and sample
editing in a browser. Promote to the production rehearsal only after reviewing
the test environment.
Once `deploy/production` has been created by promotion:

```bash
kubectl apply -k deploy/argocd/production-template
kubectl get application -n argocd-production
```

The `production-template` directory name is retained for compatibility; it now
contains the second local instance's application and project configuration.

## Media and storage

The default local-path storage class uses `WaitForFirstConsumer`, so claims
bind on the selected worker. Application media and database volumes are
separate for test and production. Verify placement with `kubectl get pods -n
bedlam-like-music-test -o wide` and repeat for production.

For test media import, use `deploy/k8s/media-import.yaml`. Its selector and
toleration target the test worker. For a production import, change its namespace,
selector, and toleration to production in a temporary copy. Delete only the
utility pod after importing; retain the PVC.

## Recovery and upgrades

Keep the bootstrap version pinned. Review upstream upgrade notes and take
backups before changing it, then rerun bootstrap and verify both installations.
Never delete application namespaces or PVCs as a troubleshooting shortcut.
See [operations](operations.md) for recovery and rollback, and
[environment limits](deployment-environments.md) before external deployment.
