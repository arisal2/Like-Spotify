# Architecture

## System context

Bedlam-Like-Music is a single-origin web application. nginx serves the compiled
React SPA and proxies `/api/` and `/media/` to the Go service. The current
studio creates and edits audio in the browser and stores samples in IndexedDB.
The existing Go service and MySQL retain account and legacy music-library data;
they do not store studio samples or synth patches.

```text
                       ┌───────────────────────┐
Browser ── HTTP(S) ──▶ │ nginx + React SPA     │
                       └───────────┬───────────┘
                                   │ /api, /media
                       ┌───────────▼───────────┐
                       │ Go API                │
                       │ auth, library, mixes  │
                       └───┬─────────┬─────┬───┘
                           │         │     │ optional HTTPS
                           ▼         ▼     ▼
                         MySQL     media  AI provider
```

In the browser, Web Audio generates synth notes, analyzes short recordings,
and renders edited WAVs. IndexedDB holds samples and mixer settings; local
storage holds the synth patch and theme. These browser-local stores are not
synced across devices and are not covered by MySQL or media-volume backups.

## Component responsibilities

### Web

- Renders the sample library, synthesizer, sound matcher, and theory workspace.
- Keeps audio synthesis, recording, sample editing, and local persistence in
  the browser. Microphone access is requested only when recording starts.
- Does not connect directly to MySQL, the media volume, or the AI provider.

### API

- Validates requests with strict JSON decoding and a 16 KiB body limit.
- Owns registration, login, sessions, authorization, and resource ownership.
- Stores playlists, likes, saved mixes, feedback, and listening history.
- Serves only `/media/music/*` and `/media/artwork/*`; directory listings and
  unrelated filesystem paths are not exposed.
- Produces structured request logs with an `X-Request-ID` response header.

### MySQL

- Runs schema migrations before the API starts in Compose.
- Runs migrations as an Argo CD sync hook in Kubernetes.
- Uses a named Compose volume locally and a 5 GiB StatefulSet claim in the
  base Kubernetes manifests.

### Media storage

- Compose mounts `${MEDIA_PATH:-./assets}` read-only at `/media`.
- GitOps mounts the `media` PVC read-only into API pods.
- Expected subdirectories are `music/` and `images/artwork/`.

## Authentication and request trust

The API stores an opaque session token in the `blm_session` HttpOnly cookie.
Authenticated mutation requests must include the matching `X-CSRF-Token` from
`GET /api/v1/auth/session`. Non-safe methods also reject a mismatched `Origin`.
Passwords are bcrypt hashes; login and registration are rate-limited in memory.

`COOKIE_SECURE=true` is required behind HTTPS. Because rate limits are
per-process, a public multi-replica deployment should eventually move them to a
shared store or enforce limits at the edge.

## Recommendation and AI flow

The existing API provides local mood matching using catalog tags. When
`OPENAI_API_KEY` and `OPENAI_MODEL` are configured, the API may send the mood
prompt and catalog metadata to the provider. The API validates returned song
identifiers against the local catalog. Account details and listening history
are not part of the provider request.

## Deployment flow

CI selects relevant checks by changed path. A successful `development` run
publishes changed ARM64 images and records the tested source and image tags in
`deploy/test`; test Argo CD reconciles that branch. After promotion to `master`,
the same process updates `deploy/production` for the production-rehearsal Argo
instance. Unchanged images keep their prior tags; changed components are built
for the corresponding source revision.

## Kubernetes security boundaries

- Restricted Pod Security labels on the namespace.
- Non-root users, read-only root filesystems, dropped Linux capabilities, and
  runtime-default seccomp profiles.
- Service-account token mounting disabled.
- Default-deny network policy with explicit web → API → MySQL paths.
- CPU and memory requests/limits plus health probes.

NetworkPolicy only provides isolation when the cluster CNI enforces it.

For the current three-node topology and production promotion rules, see
[deployment environments](deployment-environments.md) and [CI/CD](github-actions.md).
