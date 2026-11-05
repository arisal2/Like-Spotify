# Like — Product Requirements Document

**Status:** Proposed  
**Version:** 1.0  
**Product horizon:** Three releases  
**Working tagline:** Less scrolling. More listening.

## 1. Product vision

Like is a calm, personal music space that turns a feeling, activity, or moment
into a playable queue in seconds. It favors intentional listening over an
endless feed and explains why its recommendations fit.

The product should feel small, fast, trustworthy, and distinctly personal. AI
supports discovery and organization, but never invents catalog content, makes
silent destructive changes, or becomes a requirement for basic playback.

## 2. Problem

Music products often make users search through large catalogs, manage queues by
hand, or accept opaque recommendations. For a user who knows the desired mood
but not the exact song, reaching the right listening session takes too long.

Like currently proves the core interaction with a demo catalog, playback,
likes, playlists, and mood mixes. It does not yet support a real catalog,
durable listening context across devices, collaborative discovery, or the
operational features needed for a public product.

## 3. Target users

### Primary: intentional listener

Listens while working, relaxing, exercising, or hosting. Knows the desired
energy and atmosphere but does not want to curate every track.

### Secondary: playlist maker

Enjoys collecting and sequencing music. Wants fast organization, useful
suggestions, and control over every AI-assisted change.

### Secondary: returning listener

Wants to resume a recent session, rediscover a previous mix, and receive better
recommendations without surrendering privacy.

## 4. Product principles

1. **Play in under ten seconds.** The shortest path ends in sound, not another
   configuration screen.
2. **Control stays visible.** Users can inspect, edit, undo, and regenerate AI
   output.
3. **Catalog truth only.** Recommendations reference playable catalog IDs and
   are validated server-side.
4. **Graceful without AI.** Search, playback, libraries, and local mood matching
   remain useful when an AI provider is unavailable.
5. **Private by default.** Listening history is private, optional for
   personalization, exportable, and deletable.
6. **Calm beats crowded.** Each screen has one dominant action and avoids
   engagement traps.

## 5. Goals and success measures

The first public beta should demonstrate that users can reliably get from an
intent to a satisfying listening session.

| Goal | Metric | Beta target |
| --- | --- | --- |
| Fast value | Median time from landing to playback | Under 10 seconds |
| Useful mixes | Mood previews played or saved | At least 55% |
| Returning value | Weekly listeners returning within 7 days | At least 30% |
| Reliable playback | Sessions without an unrecoverable playback error | At least 99.5% |
| Quality | Mixes receiving a positive rating | At least 70% |
| Performance | Mobile LCP at p75 | Under 2.5 seconds |
| Accessibility | Critical WCAG 2.2 AA violations | Zero |

Metrics must exclude staff/test traffic and must not store raw mood prompts in
analytics. Targets are initial hypotheses, not promises.

## 6. Scope and roadmap

### Release 1 — Personal listening beta

Objective: make the existing experience dependable and worth returning to.

#### P0 requirements

- Resume the current track, position, queue, volume, shuffle, and repeat state
  after refresh and sign-in on the same device.
- Add listening history with clear, deleteable entries and a privacy toggle.
- Save generated mixes with their prompt summary, generation source, and track
  snapshot so later catalog changes do not silently rewrite them.
- Let users rate a mix with `fits`, `not quite`, or `skip feedback`.
- Allow regeneration with lightweight adjustments: calmer, more energetic,
  more familiar, and more adventurous.
- Provide undo for playlist deletion and destructive playlist edits.
- Add account settings for display name, password change, session revocation,
  data export, and account deletion.
- Deliver a responsive, keyboard-accessible player with screen-reader
  announcements for track and playback changes.
- Add a production domain, TLS, automated DNS, uptime checks, backups, and
  restore verification before public access.

#### P1 requirements

- Recently played and recently generated sections.
- Playlist duplicate, cover selection, and drag-and-drop ordering with an
  accessible keyboard alternative.
- Search filters for artist, album, mood, energy, and duration.
- Installable PWA shell with resilient browsing and clear offline state. Audio
  download is out of scope until licensing permits it.

### Release 2 — Better discovery

Objective: improve recommendations using explicit taste, not opaque tracking.

- Onboarding that lets users choose moods, activities, and a few favorite
  artists or tracks; it must be skippable.
- A transparent taste profile the user can view, edit, reset, or disable.
- Mix explanations at track level, such as energy transition or matching mood.
- Session-aware sequencing that avoids abrupt energy changes and excessive
  artist repetition.
- Natural-language library actions with confirmation, for example: “Make a
  30-minute focus playlist from songs I already liked.”
- Weekly personal mix generated only for opted-in users.
- Recommendation evaluation set covering common moods, adversarial prompts,
  invalid catalog output, repetition, and diversity.

### Release 3 — Shared listening

Objective: add social utility without creating a public engagement feed.

- Shareable read-only playlist links with revocation and optional expiration.
- Invite-only collaborative playlists with owner/editor/viewer roles.
- Real-time presence and optimistic editing with conflict-safe ordering.
- Optional listening rooms with synchronized queue state and host controls.
- Abuse reporting, rate limits, audit events, and share-link enumeration
  protection before collaboration is enabled publicly.

## 7. Core user journeys

### Start from a mood

1. User enters “quiet coding before sunrise.”
2. Like shows a named, ordered, playable mix with a short explanation.
3. User previews immediately without saving.
4. User adjusts the energy or saves the result.
5. Feedback improves future opted-in recommendations.

**Acceptance criteria**

- Preview returns within 3 seconds locally and 8 seconds with an AI provider at
  p95, excluding a clearly reported provider timeout.
- Every returned track is present and playable in the current catalog.
- Provider failure automatically returns a labeled local mix.
- Saving is idempotent and cannot create duplicate playlists on retry.

### Resume listening

1. Returning user opens Like.
2. The previous queue and position are restored.
3. Playback remains paused until the user acts, respecting browser policy.

**Acceptance criteria**

- Restored state never references inaccessible tracks.
- A user can clear the saved session and listening history independently.
- Another signed-in user on the same browser cannot see the previous user's
  private queue or history.

### Manage a playlist safely

1. User creates or edits a playlist.
2. Updates appear immediately and persist atomically.
3. A destructive action shows its impact and supports undo.

**Acceptance criteria**

- Ownership is enforced server-side for every operation.
- Concurrent updates never produce duplicate positions or partial track lists.
- Undo remains available for at least 10 seconds and survives a transient API
  retry.

## 8. AI requirements

- Send the minimum required prompt and catalog metadata; never send account
  identifiers, credentials, raw listening history, or private playlist names.
- Treat model output as untrusted input and validate it against a strict schema
  and the current catalog.
- Set provider timeouts, cost ceilings, rate limits, and a circuit breaker.
- Clearly label AI, local fallback, and previously saved results.
- Do not train on or retain user prompts beyond the documented provider policy
  without explicit opt-in.
- Store a prompt summary for saved mixes, not the raw prompt, unless the user
  chooses to retain it.
- Maintain deterministic local fallback and regression fixtures.
- Record latency, provider, model, token usage, fallback reason, and validation
  failures without recording prompt content.

## 9. Platform requirements

### Reliability and performance

- API availability objective: 99.9% monthly after public beta.
- Readiness must include required dependencies; liveness must not depend on
  external providers.
- Use bounded retries with jitter and no retry storms.
- Back up user data daily, encrypt backups, define retention, and run quarterly
  restore exercises.
- Serve media through object storage and a CDN before catalog growth.

### Security and privacy

- TLS-only production traffic, secure cookies, CSRF protection, strict origin
  checks, and revocable hashed sessions.
- Managed secrets through workload identity; no long-lived cloud credentials in
  GitHub or Kubernetes manifests.
- Image signing, SBOMs, vulnerability gates, admission policy, and immutable
  deployment references.
- Per-account and per-IP abuse controls using a shared store at multiple
  replicas.
- Export and deletion jobs must be auditable, retryable, and complete within
  the published privacy window.

### Observability

- Structured logs with request and trace IDs and automatic sensitive-field
  redaction.
- Metrics for request rate, error rate, latency, saturation, playback failures,
  mix outcomes, and provider fallback.
- Distributed traces across web gateway, API, database, and AI provider calls.
- Alerts tied to user impact with documented runbooks.

## 10. Data model additions

- `listening_events`: user, catalog track, event type, position, device-scoped
  session, and timestamp with retention controls.
- `saved_mixes`: owner, name, prompt summary, source, model metadata, immutable
  track snapshot, and creation time.
- `mix_feedback`: mix, owner, rating, optional structured reason, and timestamp.
- `playback_states`: owner/device, queue snapshot, active index, position, and
  playback settings.
- `account_sessions`: session metadata and last-used time for revocation UI.
- Later releases add share grants, collaborators, and audit events.

Schema changes require forward-compatible migrations and a tested rollback or
roll-forward plan. Analytics data must be logically and operationally separate
from authentication data.

## 11. Non-goals for the beta

- Uploading user-owned audio
- Music licensing, royalty accounting, or commercial streaming rights
- Native iOS or Android applications
- Public profiles, follower counts, comments, or an algorithmic social feed
- Voice cloning, generated music, or generated artist artwork
- Offline audio downloads
- Replacing a full commercial streaming catalog

## 12. Rollout

1. **Internal:** synthetic catalog, security review, restore exercise, and AI
   evaluation suite.
2. **Private alpha:** up to 25 invited users; instrument journey funnels and
   interview failures weekly.
3. **Public beta:** staged traffic, published privacy controls, support path,
   uptime monitoring, and rollback tested before announcement.

Feature flags must protect listening history personalization, AI provider use,
sharing, and collaboration. A flag must disable each feature without requiring
a deployment.

## 13. Release 1 definition of done

- All P0 requirements meet their acceptance criteria.
- Threat model and privacy review are complete.
- Accessibility review finds no critical WCAG 2.2 AA failures.
- Load tests cover expected beta traffic at 3× projected peak.
- Backup restoration succeeds in a clean environment.
- Dashboards, alerts, and runbooks cover the defined service objectives.
- Product analytics can answer the success metrics without storing raw prompts.
- CI, end-to-end tests, migration tests, and security gates pass on the exact
  images promoted by Argo CD.

## 14. Open decisions

- Catalog source and licensing model
- Initial deployment cloud, DNS provider, and Gateway implementation
- Whether playback state syncs across devices in Release 1 or remains
  device-scoped
- Retention period for listening events and deleted-account backups
- AI provider budget per active user and behavior when the budget is exhausted
- Beta geography and corresponding privacy requirements
