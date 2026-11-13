# Architecture

Bedlam-Like-Music is a frontend-only browser studio. Nginx serves the React and
TypeScript application; it has no API or database dependency.

```text
Browser → nginx → React studio
                   ├── Web Audio: synthesis, mixing, analysis
                   ├── OfflineAudioContext: edited samples and phrase rendering
                   ├── IndexedDB: samples, albums, mixer settings
                   └── localStorage: synth patch and theme
```

## Audio and state

Native Web Audio is the project-owned audio boundary. Live synth voices share
one context and output headroom; key releases affect individual pitches.
Phrase capture stores bounded note timings and per-note patch snapshots, then
renders a WAV for the single-sound editor. Samples mix from their beginnings;
there is no multitrack arrangement timeline.

Imported audio is decoded before saving. Invalid legacy files are reported and
skipped during mixing. Mixer field updates are serialized and persisted locally.
Recordings and imported samples never leave the browser.

## Persistence limits

Storage belongs to the browser origin, including its port. Separate deployment
URLs have separate libraries. Clearing site data or browser eviction can lose
samples; retain original files separately. Unsaved synth takes are session-only.
There are no accounts, remote project sync, AI API calls, or server media storage.

## Serving and deployment

Frontend nginx permits same-origin microphone access and local blob media while
retaining its CSP and other security headers. Removed legacy API/media paths
return 404. CI publishes only the frontend image; Argo CD reconciles the test and
production-rehearsal overlays. See [CI/CD](github-actions.md).

Pods run non-root with read-only root filesystems, dropped capabilities,
resource limits, health probes, and no mounted service-account token.
Network policies default-deny traffic and allow inbound HTTP to web; the
frontend server needs no outbound access. Enforcement depends on the CNI.

## Legacy retirement

The unused player, Go API, MySQL, recommendation integration, and migration jobs
have been removed. Existing storage and backups are not deleted. The explicit
retained media claim in GitOps overlays is a data-retirement safeguard, not a
studio dependency. See [operations](operations.md) before retiring old volumes.
