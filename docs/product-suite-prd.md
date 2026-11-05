# Product Requirements: Personal Application Suite

| Field           | Value                                                               |
| --------------- | ------------------------------------------------------------------- |
| Status          | Draft for product review                                            |
| Owner           | Project maintainers                                                 |
| Last updated    | 2026-11-06                                                          |
| Decision needed | Approve direction and scope before implementation planning and OKRs |

## Executive summary

Like will evolve from a music application into a self-hosted personal application suite. Music will remain a first-class product and be joined by Time, Projects, and Budget. A shared portal, identity, theme system, and delivery platform will make the products feel coherent while each application remains independently testable and deployable.

This document defines product direction and requirements. It intentionally does not set OKRs; those should follow approval and baseline measurement.

## Problem

Adding unrelated features directly to the current application would create inconsistent experiences, coupled deployments, unclear data ownership, and duplicated security controls. Users need one understandable suite without one fragile application or shared database becoming the boundary for every feature.

## Vision

A private-by-default home for a user's everyday digital life: media, time, work, and money. It should be easy to run locally, safe to extend, and straightforward to recover.

### Principles

1. **Private by default:** collect the minimum data and make sharing explicit.
2. **One suite, clear boundaries:** share the product shell, not domain internals.
3. **Independent delivery:** test and deploy only affected components.
4. **Portable data:** support documented exports in common formats.
5. **Recoverable operation:** backups and restore verification are requirements.
6. **Accessible interfaces:** keyboard use, reduced motion, visible focus, and readable contrast are built in.
7. **Optional AI:** core workflows remain useful without an AI provider.

## Goals

- Provide a portal that launches and summarizes installed applications.
- Provide one identity and session model across the suite.
- Preserve and migrate the existing music experience without data loss.
- Add time tracking, project management, and budgeting in staged releases.
- Support local Kubernetes deployment through the existing GitOps workflow.
- Define shared UI, API, event, security, and observability contracts.
- Allow an application to be developed, disabled, deployed, or replaced independently.

## Non-goals

- Reproducing every feature of established commercial products.
- Building a public social network, advertising platform, or native mobile app initially.
- Supporting multiple orchestration platforms in the first release.
- Sharing application tables or allowing cross-domain SQL joins.
- Making AI a prerequisite for a critical workflow.

## Users

**Self-hoster:** an individual or household that values control of personal data, simple setup, reliable upgrades, and clear recovery guidance.

**Contributor:** a developer who needs stable contracts, templates, fast tests, and local development documentation to improve or add an application.

## Platform requirements

### Portal

The portal must:

- Show applications available to the signed-in user.
- Provide an application switcher, profile menu, theme control, and sign-out.
- Register applications through configuration rather than hard-coded navigation.
- Show application health without exposing sensitive infrastructure details.
- Continue working when an individual application is offline.

A customizable dashboard and cross-application search are deferred.

### Identity and access

The platform must provide:

- Local accounts with secure password hashing.
- An OAuth/OIDC abstraction, with GitHub recommended as the first provider.
- Secure account linking with proof of ownership for both identities.
- Short-lived sessions or access tokens with a documented renewal strategy.
- PKCE, state, nonce, and exact redirect URI validation where applicable.
- Initial `user` and `admin` roles with server-side authorization.
- CSRF protection for cookie-authenticated mutations.
- Session revocation and a user-visible active-session list.
- Auditing for sign-in, provider linking, role changes, and revocation.

Secrets must come from the runtime secret provider and never be committed to Git.

### Themes and shared experience

The first themes are System, Light, Dark, and Midnight. Theme selection must apply before first meaningful paint, persist across sessions, use shared design tokens, meet WCAG 2.2 AA contrast for supported flows, and respect reduced-motion preferences.

The shared UI package should contain tokens and small primitives. It must not become a release bottleneck for unrelated applications.

## Application requirements

### Music

The existing product becomes the Music module. It must preserve library browsing and playback, playlists and favorites where currently supported, playback state, and existing user data. Media remains outside Git and is accessed through a documented storage abstraction. Migration and rollback must be rehearsed.

Queue management, search, waveform previews, and explainable recommendations are possible follow-ups.

### Time

Time must support one active timer per user, pause and resume, manual entries and corrections with an audit trail, labels and notes, optional project or task references, daily and weekly summaries, and CSV/JSON export.

Offline capture, team billing, and invoicing are deferred.

### Projects

Projects must support projects and members, tasks with assignee/priority/status/due date, list and board views over the same data, comments, activity history, archive and restore, and JSON export.

Real-time collaborative editing and complex enterprise workflows are deferred.

### Budget

Budget must support manual accounts, categories, transactions, monthly budgets, recurring templates, CSV import with preview and duplicate detection, cash-flow/category reports, exports, and an audit trail.

Direct bank connections, trading, tax filing, and financial advice are out of scope. Suggested financial actions always require confirmation.

## Cross-application behavior

Integrations use versioned APIs or events, never direct database access. The first integration is Time → Projects:

- A time entry may reference a project or task by immutable external identifier.
- Projects remains the source of truth for project and task details.
- Time remains usable while Projects is unavailable.
- An unavailable target does not delete historical time entries.

The portal may aggregate summaries only through documented least-privilege APIs.

## AI capabilities

Candidate capabilities include task breakdown suggestions, summaries of time and project activity, transaction categorization suggestions, and music discovery based on the user's own library.

Every AI feature must:

- Be explicitly enabled by an administrator or user.
- Explain what data leaves the system before it is sent.
- Minimize and redact data where possible.
- Ask for confirmation before changing data.
- Record provider/model and outcome without unnecessarily retaining sensitive prompts.
- Preserve a deterministic non-AI workflow for the core task.

## Technical architecture

Target structure:

```text
apps/
  portal-web/       identity-api/
  music-web/        music-api/
  time-web/         time-api/
  projects-web/     projects-api/
  budget-web/       budget-api/
packages/
  ui/  auth-client/  api-client/  observability/
platform/
  kubernetes/  argocd/  pipelines/
```

This is an incremental target, not a requirement for an immediate rewrite.

### Boundaries

- Each API owns its schema and migrations.
- Identity supplies stable user IDs; applications store only identifiers they need.
- Public contracts are versioned and documented.
- Reliable asynchronous events use an outbox or equivalent when introduced.
- Shared-package changes test affected consumers; unrelated app changes do not.
- Each component owns its image, Kubernetes workload, resource limits, and health checks.

### Delivery and DNS

- Pull requests run change-aware checks plus required pre-merge critical-journey E2E tests.
- Merges to `master` publish only changed deployable components.
- Argo CD reconciles declared manifests; CI does not directly mutate workloads.
- Recommended local names are `home.local`, `music.local`, `time.local`, `projects.local`, `budget.local`, and `argocd.local`.
- Stable local DNS, ingress, and TLS must eliminate routine port forwarding.

## Security, privacy, and data

The suite must provide encryption in transit, secure headers, restrictive CORS, request and rate limits, least-privilege identities, network policies, non-root containers, dependency/image/source/secret scanning, documented retention and deletion, user export, encrypted backups, restore tests, and tamper-resistant audit logs.

Sensitive budget data must not appear in logs, metrics, traces, or AI prompts by default.

## Reliability and observability

Every application must expose separate liveness and readiness signals and provide structured logs with correlation IDs, privacy-safe request/error/latency metrics, trace propagation where useful, alerts tied to user-visible failures, graceful handling of optional dependencies, and tested rollback for application and database changes.

Service-level targets should be set after baselines exist.

## Delivery phases

### Phase 0: approve and measure

- Approve this PRD and resolve blocking decisions.
- Measure current build, test, deployment, reliability, and usage baselines.
- Create the roadmap and OKRs.

### Phase 1: platform foundation

- Add the portal, application registry, identity contract, themes, and service template.
- Document DNS, ingress, secrets, backups, and Argo CD recovery.
- Prove independent delivery with a minimal application.

### Phase 2: Music migration

- Move Music behind the shared portal and identity contract.
- Migrate data and storage with rollback verification.
- Preserve critical journeys and performance.

### Phase 3: Time

- Deliver timers, manual entries, summaries, and exports.

### Phase 4: Projects

- Deliver project/task workflows and Time → Projects integration.

### Phase 5: Budget

- Deliver records, imports, budgets, and reporting.
- Verify the additional privacy, audit, backup, and restore controls.

AI features enter a phase only after the equivalent non-AI workflow is stable.

## Platform acceptance criteria

The foundation is complete when:

- One sign-in opens two independently deployed applications.
- The portal discovers enabled applications from configuration.
- Theme and profile preferences remain consistent.
- One unavailable application does not break the portal or another application.
- An app-only change tests and deploys only that app, apart from required suite E2E checks.
- A shared contract change tests every affected consumer.
- One application's database credentials cannot read another application's data.
- Local DNS and TLS expose stable endpoints without routine port forwarding.
- A backup restore succeeds in a disposable environment.
- A contributor can create and deploy a minimal service using the documentation.

## Measures to baseline before OKRs

- Time to complete local installation and first sign-in.
- Time to create and deploy a minimal application.
- Percentage of pull requests running only affected checks.
- Pull-request feedback and post-merge deployment time.
- Backup restore success and recovery duration.
- Weekly active use and primary-workflow completion by application.
- Accessibility defects, security findings, and change failure rate.
- AI suggestion acceptance, rejection, and correction when enabled.

## Risks

| Risk                                | Mitigation                                                         |
| ----------------------------------- | ------------------------------------------------------------------ |
| Platform work delays user value     | Build the smallest foundation and ship one app at a time.          |
| Services exceed local resources     | Set budgets, make apps optional, and measure cluster capacity.     |
| Shared packages couple releases     | Keep packages small, version contracts, and test consumers.        |
| Integrations leak private data      | Use explicit scopes, least privilege, audits, and privacy reviews. |
| Music migration breaks existing use | Add compatibility tests, rehearsals, backups, and rollback gates.  |
| AI makes unsafe changes             | Require opt-in, confirmation, provenance, and non-AI paths.        |
| Budget features create false trust  | Avoid advice claims, show source data, and audit edits.            |

## Open decisions

1. Is the first release single-user, household multi-user, or both?
2. Should identity be built in or delegated to an external OIDC service?
3. Is GitHub the correct first OAuth provider?
4. Should apps initially use separate databases or schemas in one database?
5. Which local media and backup storage implementation is required?
6. Which Kubernetes distribution and ingress/DNS combination is supported?
7. What browser and device support policy is required?
8. Which AI providers, if any, meet privacy and local-operation needs?

## Approval checklist

Approve this PRD when reviewers agree on the application boundaries; portal, identity, themes, data ownership, and delivery model; the sequence of Foundation → Music → Time → Projects → Budget; the security, portability, recovery, and optional-AI principles; and the decisions required before estimates and OKRs.
