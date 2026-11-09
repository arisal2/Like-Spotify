# Backend working context

Read the repository-root `CODEX.md` first.

## Responsibility

The Go API owns authentication, authorization, Studio project metadata, asset
provenance, persistence, render orchestration, and authorized media access.
MySQL stores relational metadata; large audio binaries do not belong in MySQL.

## Current foundation to preserve

- Go `net/http`, strict JSON decoding, body limits, structured logs, and
  request IDs.
- Cookie sessions, bcrypt passwords, CSRF and Origin checks, rate limits, and
  resource ownership enforcement.
- MySQL migrations plus unit and integration tests.
- Separate liveness and readiness endpoints.
- Optional AI behind an adapter with validated output.

## Studio direction

- Add versioned projects, assets, patch revisions, render jobs, exports, and
  provenance incrementally.
- Introduce a storage interface before replacing the filesystem/PVC backend.
- Introduce a separate render-worker process only when encoding or batch work
  requires it; do not create one network service per Studio area.
- Treat filenames, audio uploads, project documents, and manifests as
  untrusted input.
- Keep every user-owned query and mutation scoped by authenticated ownership.

## Required validation

Run formatting, vetting, unit tests, and relevant MySQL integration tests for
backend changes. Add migration and authorization tests with every new owned
resource.
