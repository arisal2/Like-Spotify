# Bedlam-Like-Music Studio task board

Last updated: 2026-11-13

## Approved sequential studio repairs

Producer approved implementing the studio assessment sequentially on 2026-11-13.
First slice: AUDIO-FIX-001 — restore same-origin microphone and local audio
playback through nginx, with a native-recording browser smoke. Status: Review.
Validation: frontend lint/build/unit tests and the nginx-served native microphone,
original playback, edited preview, save/reload browser smoke passed. Tested in a
temporary container; Kubernetes remains on its existing image.
Subsequent slices cover sample handling, layout, and polyphonic phrase capture;
keep them separate from this deployment-policy repair. No publishing requested.

AUDIO-FIX-002 — sample import/editor/mixer reliability. Status: Review.
Imports validate decodability instead of trusting MIME metadata; batch errors
remain visible. Multi-file editor drops explain the single-sound boundary.
Replacement resets level/speed, mixer changes persist serially as field patches,
and legacy invalid samples are identified without blocking playable tracks.
Validation: four focused sample browser tests (including slow storage), frontend
lint/build, and 22 unit tests passed. No deployment or publishing performed.

## Approved cleanup after browser fixes

AUDIO-FIX-003 — studio layout, themes, and accessibility. Status: Review.
Samples, Synth, and Theory now share navigation/theme ownership. Removed floating
Theory navigation; repaired tablet mixer overflow and editor padding. Synth keys
wrap based on available width, and DOM/Tab order follows their visual order.
Editor opening/closing manages focus; mute labels identify their sample.
Validation: 8 affected browser journeys, 22 unit tests, lint/build passed; populated
layouts checked at 320/390/768/900/1440 px. Mobile synth and Retro Theory screenshots
reviewed. Polyphonic phrase capture is tracked below, before cleanup.

AUDIO-FIX-004 — polyphonic synth and phrase capture. Status: Review.
Independent voices and input-source ownership support chords and individual releases.
Bounded phrase capture preserves note timings and per-note patch snapshots; offline
rendering sends each take to the existing editor for separate library saves.
Capture stops on blur/hidden tab and closes held notes. Limits: 12 simultaneous
pitches, 30 seconds/128 note events per take; unsaved takes remain session-only.
Validation: 9 affected browser journeys passed (7.7 seconds), including native
frequency checks for simultaneous pitches/independent release, rendered phrase
content, and two takes surviving reload. All 26 unit tests, lint/build passed.
No publishing or deployment performed. Next slice: STUDIO-CLEANUP-001.

Producer approved on 2026-11-13: remove the unused backend rather than retaining
it for hypothetical future features. Schedule after the browser studio fixes.

STUDIO-CLEANUP-001 — remove legacy player, Go API, and MySQL. Status: Review;
source implementation follows the browser repairs. Scope:

- Remove unmounted player UI, obsolete API clients, backend code, database
  migrations, and their dependencies/tests after checking remaining references.
- Remove API/database services, proxy routes, runtime secrets/config references,
  migrations, storage resources, and obsolete health probes from Compose and
  Kubernetes/GitOps templates.
- Update CI/CD build selection, image publishing, security/dependency automation,
  observability targets, and documentation for the frontend-only studio.
- Verify recording, synthesis, editing, mixing, and browser persistence work
  without an API or database; keep frontend health probes and delivery intact.

Implementation approval does not authorize deleting persistent volumes, user
media/backups, or live data. Inventory those separately before runtime cleanup.
No replacement backend, Redis, or other service is required for this scope.
Publishing and deployment still require the Producer's explicit instruction.

Implementation evidence (2026-11-13): removed backend/player code, database and
migration workloads, proxy upstreams, unused dependencies, and legacy CSS.
Delivery builds/promotes only web; browser CI needs no API/database and includes
the native recording smoke through nginx for full runs. Retained media PVCs are
explicitly protected. Read-only inspection confirmed both live MySQL workloads
use Retain/Retain and their PVCs have no deletion owner references.
Validation: 16 current audio/data unit tests, lint/build, shell selectors, workflow
YAML/shell syntax, all seven Kustomize renders, Compose web-only config, health200,
and retired-route 404 checks passed. The nginx suite initially passed 9 checks;
after fixing test-only blob inspection to respect CSP, all 3 synth checks passed
on focused rerun. Existing browser data, backups, local credentials, volumes,
and live workloads were not changed. Producer subsequently requested pushing
the completed changes to development; no Actions-run inspection was requested.

No implementation task below is approved merely by appearing on this board.
The Producer moves a task to Ready by approving its scope and any linked
decisions.

## Current milestone: product and technical validation

| ID        | Priority | Status      | Lead role | Task                                                                                                         | Depends on          |
| --------- | -------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------ | ------------------- |
| PRD-001   | P0       | Review      | Producer  | Review and approve, revise, or reject the Bedlam-Like-Music Studio direction and Game Sound Lab MVP boundary | —                   |
| PM-001    | P0       | Review      | Producer  | Approve this role model, task workflow, and decision process                                                 | —                   |
| DEC-001   | P0       | Backlog     | Producer  | Resolve launch user, engine, rendering, formats, ownership, browser, storage, and AI decisions               | PRD-001             |
| UX-001    | P0       | Backlog     | Designer  | Map the preset-to-export Game Sound Lab journey and error/recovery states                                    | PRD-001, DEC-001    |
| ARCH-001  | P0       | Review      | Architect | Validate native Web Audio preview and offline PCM boundaries through the approved prototype                  | DEC-003, DEC-004    |
| AUDIO-001 | P0       | Review      | Coder     | Prototype deterministic oscillator/envelope rendering with a recorded seed                                   | ARCH-001            |
| AUDIO-002 | P0       | Backlog     | Coder     | Prototype waveform display, selection, loop markers, and repeated preview                                    | UX-001              |
| DATA-001  | P0       | Backlog     | Architect | Define versioned Project, Asset, PatchRevision, RenderedAsset, and ExportManifest schemas                    | DEC-005, DEC-006    |
| STORE-001 | P0       | Backlog     | Architect | Define binary-storage interface, content hashing, authorization, and retention behavior                      | DEC-008, DATA-001   |
| QA-001    | P0       | Backlog     | Architect | Define generated-signal fixtures, numeric audio tolerances, and export-validation strategy                   | ARCH-001            |
| SEC-001   | P0       | Backlog     | Architect | Threat-model uploads, project imports, DSP complexity, encoding jobs, and export downloads                   | DATA-001, STORE-001 |
| OPS-001   | P0       | In progress | Architect | Add isolated staging and approval-gated production GitOps promotion using immutable images                   | —                   |
| SEC-002   | P0       | Review      | Coder     | Block vulnerable dependency changes and remediate the active Go module advisory                              | —                   |

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

## OPS-001: approved three-node update (2026-11-10)

User approved a control plane and separate test/production workers, two Argo CD
instances, and development/master branches. Implementation includes dedicated
scheduling, namespace RBAC, source-aware image reuse, native ARM64 publication,
and production source verification. Activation still requires publishing the
reviewed changes, repository protection settings, runtime Secrets, and a live
application smoke test. Do not mark complete based only on manifest rendering.

Validation on 2026-11-10: all three nodes Ready; all 14 Argo CD pods Running
on their assigned workers; both local health endpoints returned `ok`.
Reciprocal cross-environment deployment permissions were denied. Distinct
runtime Secrets were created without writing credentials to the repository.
All six Kustomize configurations rendered; both application overlays and Argo
CD configurations passed server-side dry-run. Four build-selection scenarios
passed, including initial publication, docs-only reuse, multi-commit backend
changes, and changes in both components. Workflow YAML, embedded Bash syntax,
Markdown formatting, and whitespace checks passed. GitHub Actions execution,
application smoke tests, and production reviewer configuration remain pending.
