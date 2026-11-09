# Bedlam-Like-Music Studio project management

This directory keeps product execution understandable without requiring an
external project-management service.

- [Task board](tasks.md) — scoped work, priority, status, owner, dependencies,
  acceptance checks, and evidence.
- [Decision log](decisions.md) — decisions reserved for the Producer, including
  alternatives and consequences.

## Roles

| Role      | Owner | Accountability                                                     |
| --------- | ----- | ------------------------------------------------------------------ |
| Producer  | User  | Final product, priority, scope, acceptance, and release decisions  |
| Architect | Codex | Architecture proposals, trade-offs, risks, and decision records    |
| Designer  | Codex | Workflows, interaction design, accessibility, themes, and language |
| Coder     | Codex | Implementation, tests, documentation, and technical handoff        |

The Producer has final authority. Codex should recommend a preferred option and
explain trade-offs, but not silently decide unresolved product or architecture
questions.

## Task workflow

```text
Backlog → Ready → In Progress → Review → Done
                   └────────────→ Blocked
```

- **Backlog:** useful but not approved for implementation.
- **Ready:** scope and acceptance criteria approved by the Producer.
- **In Progress:** active implementation or design work.
- **Review:** implementation is complete and evidence is attached.
- **Done:** accepted by the Producer.
- **Blocked:** cannot progress without a recorded decision or external change.

Only the Producer moves product work from Review to Done. A task requiring a
pending decision cannot become Ready.

## Task format

Every implementation task should identify:

- Outcome and user value.
- Scope and explicit non-scope.
- Producer decisions required.
- Dependencies and affected areas.
- Acceptance criteria.
- Validation evidence.
- Documentation and migration impact.
