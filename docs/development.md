# Development and testing

## Requirements

- Node.js 26 and npm 12.2.2
- Docker for the nginx-served app and deployment-header smoke
- kubectl for optional Kubernetes manifest validation

No API, database, environment passwords, or server media directory is required.

## Run the studio

```bash
docker compose up --build -d
docker compose ps
curl --fail http://localhost:8080/health/web
```

Open <http://localhost:8080>. Microphone recording requests browser permission;
use localhost or HTTPS. Stop the frontend with `docker compose down`.
Do not use volume deletion or orphan removal while retaining old deployment data.

For frontend development:

```bash
cd web
npm ci
npm run dev
```

Vite runs at <http://127.0.0.1:5173>. This is a different browser origin from the
Compose/test URL, so it has its own local library.

## Repository layout

```text
web/                  browser studio, audio engine, tests, nginx image
deploy/k8s/           frontend base and environment overlays
deploy/argocd/        isolated test and production-rehearsal Argo CD
deploy/observability/ optional Prometheus, Grafana, and web probes
scripts/              check/image selection and cluster bootstrap
docs/                 product, development, deployment, and operations guides
```

## Checks

From `web`:

```bash
npm run lint
npm test
npm run build
```

Unit tests cover pure audio/data logic in Node. Browser tests cover actual
audio APIs, persistence, and user journeys using generated signals.

Against a running Vite server:

```bash
E2E_BASE_URL=http://127.0.0.1:5173 npx playwright test e2e/synth.spec.ts
```

Against the nginx-served app, run all journeys including native recording:

```bash
DEPLOYED_AUDIO_SMOKE=1 E2E_BASE_URL=http://localhost:8080 npm run test:e2e
```

The native recording smoke uses a fake audio device, without replacing
getUserMedia or MediaRecorder. It verifies original/edited playback and save/reload.
Other recording tests use mocks for deterministic analysis behavior.

## Studio workflow

Samples, Synthesizer, and Music theory share navigation and themes. Sample
imports validate decodability and summarize batch errors. The editor opens one
sound; use Add samples for multiple library files.

The synth plays chords. Choose Record phrase, play, Stop phrase, then Add phrase
to editor and save a copy. Each saved take is separate. The note selector exports
one selected note. Takes capture timings and patch snapshots for at most 30
seconds/128 note events. Blur or a hidden tab stops capture. Unsaved takes remain
session-only; save them before leaving the synth.

## Kubernetes manifests

```bash
for overlay in base local test production; do
  kubectl kustomize "deploy/k8s/$overlay" > "/tmp/$overlay.yaml"
done
kubectl kustomize deploy/argocd > /tmp/argocd.yaml
kubectl kustomize deploy/argocd/production-template > /tmp/argocd-production.yaml
kubectl kustomize deploy/observability > /tmp/observability.yaml
```

For an optional manual local smoke:

```bash
docker build -f web/Dockerfile -t bedlam-like-music-web:local .
kubectl apply -k deploy/k8s/local
```

Normal delivery uses [Argo CD](argo-cd.md); do not manually apply GitOps overlays.
