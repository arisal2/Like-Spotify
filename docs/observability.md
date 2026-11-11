# Local observability

The lab stack is deliberately small and disposable. `deploy/observability` installs Prometheus, Grafana, and Blackbox Exporter into `bedlam-observability`.

Prometheus probes the web and API health endpoints in both `bedlam-like-music-test` and `bedlam-like-music-production`. Grafana exposes a local viewer-only interface at `http://localhost:3000`; it has no stored credentials and its data is discarded when the pod is replaced.

Apply it after both application namespaces exist:

```sh
kubectl apply -k deploy/observability
kubectl -n bedlam-observability rollout status deployment/prometheus
kubectl -n bedlam-observability rollout status deployment/grafana
```

In Grafana, use the provisioned Prometheus datasource and query `probe_success` to see the four health checks. This stack is for the local deployment lab only. A real environment needs persistent storage, authentication, TLS, alert routing, and a managed secrets solution.
