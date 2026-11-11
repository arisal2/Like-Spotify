#!/usr/bin/env bash
# Install two namespace-scoped Argo CD instances; never deploy unreviewed app code.
set -euo pipefail
cd "$(dirname "$0")/.."
[[ "$(kubectl config current-context)" == docker-desktop ]] || { echo 'Expected docker-desktop context' >&2; exit 1; }
version=v3.6.0
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
url="https://raw.githubusercontent.com/argoproj/argo-cd/${version}/manifests"
curl -fsSL "$url/namespace-install.yaml" -o "$work/install.yaml"
for crd in application appproject applicationset; do
  curl -fsSL "$url/crds/${crd}-crd.yaml" -o "$work/${crd}.yaml"
  kubectl apply --server-side -f "$work/${crd}.yaml"
done
for env in test production; do
  node=desktop-worker
  [[ "$env" != production ]] || node=desktop-worker2
  kubectl label node "$node" "bedlam.io/environment=$env" --overwrite
  kubectl taint node "$node" "bedlam.io/environment=$env:NoSchedule" --overwrite
  kubectl create namespace "argocd-$env" --dry-run=client -o yaml | kubectl apply -f -
  kubectl create namespace "bedlam-like-music-$env" --dry-run=client -o yaml | kubectl apply -f -
  kubectl label namespace "bedlam-like-music-$env" \
    pod-security.kubernetes.io/enforce=restricted \
    pod-security.kubernetes.io/enforce-version=v1.36 \
    pod-security.kubernetes.io/audit=restricted \
    pod-security.kubernetes.io/warn=restricted --overwrite
  cat > "$work/kustomization.yaml" <<YAML
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: argocd-$env
resources: [install.yaml]
patches:
  - target:
      kind: (Deployment|StatefulSet)
    patch: |-
      - op: add
        path: /spec/template/spec/nodeSelector
        value:
          kubernetes.io/os: linux
          bedlam.io/environment: $env
      - op: add
        path: /spec/template/spec/tolerations
        value:
          - key: bedlam.io/environment
            operator: Equal
            value: $env
            effect: NoSchedule
  - target:
      kind: ConfigMap
      name: argocd-cm
    patch: |-
      - op: add
        path: /data
        value:
          installationID: bedlam-$env
          application.resourceTrackingMethod: annotation
YAML
  kubectl kustomize "$work" | kubectl apply --server-side -f -
  sed "s/ENVIRONMENT/$env/g" deploy/cluster/environment-rbac.yaml | kubectl apply -f -
done
kubectl apply -f deploy/argocd/project.yaml -f deploy/argocd/local-service.yaml
kubectl apply -f deploy/argocd/production-template/project.yaml -f deploy/argocd/production-template/local-service.yaml
