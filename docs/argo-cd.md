# Argo CD on Docker Desktop

This guide sets up the local cluster used by this repository. It exposes the
app at `http://localhost:8080` and Argo CD at `https://localhost:8082`.

## 1. Prepare the cluster

Enable Kubernetes in Docker Desktop and confirm the context before applying
anything:

```bash
kubectl config use-context docker-desktop
kubectl get nodes
```

Create the namespace and database secret outside Git. Choose your own values;
the password in `DATABASE_DSN` must match `MYSQL_PASSWORD`.

```bash
kubectl create namespace like-spotify
kubectl create secret generic app-secrets -n like-spotify \
  --from-literal=MYSQL_PASSWORD='<app-password>' \
  --from-literal=MYSQL_ROOT_PASSWORD='<root-password>' \
  --from-literal=DATABASE_DSN='like_spotify:<app-password>@tcp(mysql:3306)/like_spotify?parseTime=true'
```

Use a password that can be represented in a MySQL DSN, and avoid saving real
values in shell history. The optional AI key and model can also be added as
`OPENAI_API_KEY` and `OPENAI_MODEL` keys in this Secret.

## 2. Populate media storage

The GitOps overlay creates a 1 GiB persistent volume claim named `media` and
mounts it read-only in the API. Copy licensed files into the claim before the
first deployment:

```bash
kubectl apply -n like-spotify -f deploy/k8s/gitops/media-pvc.yaml
kubectl apply -f deploy/k8s/media-import.yaml
kubectl wait --for=condition=Ready pod/media-import -n like-spotify --timeout=180s
kubectl cp assets/. like-spotify/media-import:/media
kubectl delete pod media-import -n like-spotify
```

The expected paths are `music/` and `images/artwork/` under the claim. Refer to
the catalog for filenames. Keep a backup outside the cluster; deleting or
resetting Docker Desktop's cluster can destroy its local volumes.

## 3. Install and connect Argo CD

Install a reviewed, pinned Argo CD release using the
[official installation guide](https://argo-cd.readthedocs.io/en/stable/getting_started/).
Then wait for the server and apply this repository's Argo resources:

```bash
kubectl wait --for=condition=Available deployment/argocd-server -n argocd --timeout=300s
kubectl apply -k deploy/argocd
kubectl get application like-spotify -n argocd
```

The application watches `deploy/local` at `deploy/k8s/gitops`. That branch is
created by the first successful post-merge delivery workflow, so a revision
not found message is expected until then. The Argo project restricts the
repository, destination, and allowed resource types.

## 4. Sign in and verify

Open <https://localhost:8082>. The initial username is `admin`; retrieve its
initial password from the cluster and change it after signing in:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 --decode
```

The locally generated TLS certificate may produce a browser warning. The
LoadBalancer services depend on Docker Desktop and can be reachable outside
your machine depending on its network settings. Protect the admin interface.

After a successful promotion, inspect the sync and rollout:

```bash
kubectl get application like-spotify -n argocd
kubectl describe application like-spotify -n argocd
kubectl get pods,jobs,pvc,svc -n like-spotify
```

The application automatically syncs and self-heals, and prunes resources that
are removed from its desired state. Keep the PVC and its backups safe. If GHCR
packages are private, configure a registry pull secret for the API, web, and
migration pods before syncing.

## 5. Troubleshooting

- **Revision not found:** confirm that the post-merge workflow created
  `deploy/local` and that Argo CD can reach GitHub.
- **ImagePullBackOff:** check package visibility, registry access, and pull
  credentials.
- **Migration fails:** inspect `kubectl get jobs -n like-spotify` and the Job
  logs; confirm that the database secret matches the existing database.
- **Missing music:** inspect the media claim, file paths, and catalog filenames.
- **Application unavailable:** verify the LoadBalancer service and the API/web
  pod readiness. A CNI must enforce NetworkPolicy for the declared rules to
  provide isolation.
