# Bedlam-Like-Music Studio task board

Last updated: 2026-11-09

No implementation task below is approved merely by appearing on this board.
The Producer moves a task to Ready by approving its scope and any linked
decisions.

## Current milestone: product and technical validation

| ID        | Priority | Status  | Lead role | Task                                                                                                         | Depends on          |
| --------- | -------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------ | ------------------- |
| PRD-001   | P0       | Review  | Producer  | Review and approve, revise, or reject the Bedlam-Like-Music Studio direction and Game Sound Lab MVP boundary | —                   |
| PM-001    | P0       | Review  | Producer  | Approve this role model, task workflow, and decision process                                                 | —                   |
| DEC-001   | P0       | Backlog | Producer  | Resolve launch user, engine, rendering, formats, ownership, browser, storage, and AI decisions               | PRD-001             |
| UX-001    | P0       | Backlog | Designer  | Map the preset-to-export Game Sound Lab journey and error/recovery states                                    | PRD-001, DEC-001    |
| ARCH-001  | P0       | Backlog | Architect | Write an ADR for browser preview, offline PCM rendering, and FFmpeg job boundaries                           | DEC-003, DEC-004    |
| AUDIO-001 | P0       | Backlog | Coder     | Prototype deterministic oscillator/envelope rendering with a recorded seed                                   | ARCH-001            |
| AUDIO-002 | P0       | Backlog | Coder     | Prototype waveform display, selection, loop markers, and repeated preview                                    | UX-001              |
| DATA-001  | P0       | Backlog | Architect | Define versioned Project, Asset, PatchRevision, RenderedAsset, and ExportManifest schemas                    | DEC-005, DEC-006    |
| STORE-001 | P0       | Backlog | Architect | Define binary-storage interface, content hashing, authorization, and retention behavior                      | DEC-008, DATA-001   |
| QA-001    | P0       | Backlog | Architect | Define generated-signal fixtures, numeric audio tolerances, and export-validation strategy                   | ARCH-001            |
| SEC-001   | P0       | Backlog | Architect | Threat-model uploads, project imports, DSP complexity, encoding jobs, and export downloads                   | DATA-001, STORE-001 |

## PRD-001: approve product direction

**Outcome:** the team has one approved product boundary from which estimates,
OKRs, design, and implementation can proceed.

**Producer review:**

- Game Sound Lab is the first creation MVP.
- A full DAW, adaptive audio, AI, collaboration, and selectable theme packs are
  later work.
- Existing Listen and Library behavior must not regress.
- The staged delivery sequence is acceptable.
- Open decisions are either answered or explicitly delegated to a later gate.

**Acceptance:** the Producer records approval or requested revisions and the
corresponding decisions are updated in `decisions.md`.

## PM-001: approve project workflow

**Outcome:** roles and authority are explicit, tasks have consistent states,
and context survives between sessions.

**Acceptance:**

- The Producer confirms final authority and task-state rules.
- Root and area `CODEX.md` files accurately describe responsibilities.
- No implementation begins from Backlog without approval to move it to Ready.
- GitHub mutations remain opt-in per explicit Producer request.

## Proposed first implementation slice

This slice should remain Backlog until PRD-001, relevant decisions, UX-001,
ARCH-001, QA-001, and SEC-001 are approved.

| ID         | Priority | Status  | Lead role      | Task                                         | Acceptance summary                                                        |
| ---------- | -------- | ------- | -------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| STUDIO-001 | P1       | Backlog | Coder          | Add Studio project persistence and ownership | User can create, rename, archive, restore, and reopen an owned project    |
| STUDIO-002 | P1       | Backlog | Coder          | Add versioned procedural patch schema        | Valid patches round-trip; unknown/unsafe input is rejected                |
| STUDIO-003 | P1       | Backlog | Coder          | Add browser audio-engine adapter             | One managed context previews a deterministic basic patch                  |
| STUDIO-004 | P1       | Backlog | Designer/Coder | Add first Game Sound Lab preset workflow     | User reaches audible preview from a new project without advanced controls |
| STUDIO-005 | P1       | Backlog | Coder          | Add offline WAV rendering                    | Export metadata and PCM output pass automated validation                  |
| STUDIO-006 | P1       | Backlog | Coder          | Add autosave and recovery                    | Interrupted session restores the latest valid project state               |

## Later backlog

- Waveform editing and seamless-loop workflow.
- Deterministic variation generation and rapid audition.
- FFmpeg OGG render worker and export bundles.
- Godot example and versioned manifest schema.
- Theory keyboard, scales, chords, and progression objects.
- Step sequencer, instruments, piano roll, arrangement, and mixer.
- Adaptive game-music state transitions.
- Optional AI assistance.
- Studio Dark, Retro, Cyberpunk, High Contrast, and constrained community
  themes.
