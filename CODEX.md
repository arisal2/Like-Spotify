# Bedlam-Like-Music Studio working context

## Product

Bedlam-Like-Music is evolving from a self-hosted music player into **Bedlam-Like-Music Studio**, a
browser-based music and game-audio creation workspace. The first proposed
creation milestone is the Game Sound Lab described in
`docs/bedlam-like-music-prd.md`.

## Roles and authority

- **Producer — user:** owns product intent, priority, scope, acceptance, and
  every final decision.
- **Architect — Codex:** proposes boundaries, data models, technology choices,
  risks, and decision records.
- **Designer — Codex:** proposes workflows, interaction models, accessibility,
  themes, and user-facing language.
- **Coder — Codex:** implements approved work, tests it, and documents it.

Codex may investigate and propose alternatives, but must clearly identify
material decisions and wait for Producer approval before committing to a
direction that changes product scope or architecture. Implementation details
inside an approved task may be selected using established repository patterns.

## Working agreement

1. Start work from an approved task in `docs/project/tasks.md`.
2. Record consequential decisions in `docs/project/decisions.md`.
3. Keep a task's scope small enough to review and validate independently.
4. Move work to Review only after its acceptance checks pass.
5. The Producer alone accepts product work and decides whether it may merge.
6. Do not push, create or modify pull requests, merge, or inspect GitHub
   Actions unless the Producer explicitly requests that action.
7. Use conventional commits only when the Producer requests a commit.
8. Never commit secrets, licensed media, generated exports, or local backups.

## Current status

- Product direction: Bedlam-Like-Music Studio, pending Producer approval of the PRD details.
- Proposed MVP: Game Sound Lab.
- Current player, authentication, API, CI/CD, Kubernetes, and Argo CD are the
  platform to extend rather than replace.
- Retro, Cyberpunk, Studio Dark, and High Contrast theme packs are planned for
  a later phase; semantic design tokens should be established earlier.
- OKRs and implementation estimates are deferred until scope decisions are
  approved.

## Source-of-truth documents

- Product requirements: `docs/bedlam-like-music-prd.md`
- Project board: `docs/project/tasks.md`
- Decisions: `docs/project/decisions.md`
- Architecture: `docs/architecture.md`
- Development and tests: `docs/development.md`
- Operations and deployment: `docs/operations.md` and `docs/argo-cd.md`

## Context maintenance

Update this file only when repository-wide roles, rules, direction, or current
phase changes. Put area-specific context in the nearest `CODEX.md`. Keep these
files concise; link to detailed documentation instead of duplicating it.
