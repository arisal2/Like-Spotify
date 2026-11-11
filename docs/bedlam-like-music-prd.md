# Product Requirements: Bedlam-Like-Music Studio

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| Status            | Draft for product review                                              |
| Owner             | Project maintainers                                                   |
| Last updated      | 2026-11-09                                                            |
| Product direction | Music creation and game-audio workspace                               |
| Decision needed   | Approve the direction and MVP scope before roadmap estimates and OKRs |

## Executive summary

Bedlam-Like-Music will evolve from a self-hosted music player into **Bedlam-Like-Music Studio**, a browser-based workspace for listening to music, learning theory, composing electronic music, designing original game sounds, and exporting reusable audio assets.

The existing player becomes the Listen and Library foundation. The first major creation feature will be a focused **Game Sound Lab** rather than a complete digital audio workstation. Users will create procedural sound effects, edit them non-destructively, generate controlled variations, organize them into projects, and export assets and metadata for game engines. Music-theory tools, a step sequencer, and adaptive music will expand the product incrementally.

This PRD defines product direction and requirements. OKRs will be created after approval and baseline measurements.

## Problem

Independent game creators often move between a music player, synthesizer, waveform editor, file browser, naming scripts, and engine-import tools. That workflow makes it difficult to:

- Create original sound effects without deep synthesis knowledge.
- Produce consistent variations for repeated game events.
- Preserve the parameters and provenance behind an exported sound.
- Keep loops, effects, music, licenses, and engine metadata organized.
- Move from theory or a musical idea to an audible, exportable asset.
- Reproduce or revise a sound after only the rendered file remains.

Full desktop DAWs solve many professional production problems but can be unnecessarily complex for creating compact game-audio packs. Simple sound generators often lack project management, non-destructive editing, repeatability, and game-engine export.

## Vision

**Create, understand, organize, and export original audio for games from one private workspace.**

Bedlam-Like-Music Studio should provide a welcoming path from a first synthesized UI click to adaptive game music, without hiding the musical or technical decisions that produced the result.

## Product principles

1. **Playable immediately:** every meaningful parameter change can be auditioned quickly.
2. **Non-destructive by default:** editing preserves sources, parameters, and revision history.
3. **Reproducible creation:** procedural sounds store their seed, graph, and settings.
4. **Game-ready output:** assets leave the product with predictable names, formats, loop points, and metadata.
5. **Theory in context:** explain the active scale, chord, rhythm, or sound-design concept inside the workflow.
6. **Private and self-hosted:** projects and source audio remain under the user's control.
7. **Optional AI:** AI may assist, explain, and suggest; core creation and export work without it.
8. **Progressive complexity:** beginners see useful presets while advanced controls remain available.

## Target users

### Primary: independent game creator

A developer or small team that needs original UI, action, ambience, and music assets without maintaining a complex audio toolchain.

### Secondary: learning producer

A musician learning synthesis, rhythm, harmony, and EDM arrangement who wants immediate visual and audible feedback.

### Secondary: technical sound designer

A creator who values deterministic generation, batch variations, asset conventions, and engine-friendly manifests.

## Goals

- Preserve and improve the current listening, account, playlist, and recommendation experience.
- Introduce projects that organize source material, editable patches, rendered assets, and export history.
- Let a beginner create and export a useful game sound in under ten minutes.
- Provide deterministic procedural synthesis with controlled randomization.
- Provide a waveform workflow for trimming, fades, gain, normalization, and loop points.
- Generate consistent variations without destroying the original sound.
- Export WAV and OGG assets with predictable names and a machine-readable manifest.
- Make musical scales, chords, rhythm, and synthesis concepts visible in context.
- Establish an audio engine that can later support sequencing and adaptive music.

## Non-goals for the first release

- Replacing Ableton Live, FL Studio, Logic, Reaper, or another professional DAW.
- Hosting third-party VST or Audio Unit plugins in the browser.
- Real-time multi-user editing.
- Native mobile or desktop applications.
- AI-generated copyrighted-style imitation.
- Text-to-audio generation as a dependency for core workflows.
- Direct publishing to commercial asset stores.
- Full video scoring, notation engraving, or live performance support.
- User-selectable visual theme packs in the Game Sound Lab MVP.

## Product structure

```text
Bedlam-Like-Music Studio
├── Listen       current player, playlists, favorites, discovery
├── Library      songs, samples, loops, presets, effects, exports
├── Sound Lab    procedural game effects and waveform editing
├── Compose      rhythm, piano roll, arrangement, mixer (staged)
├── Theory       scales, chords, rhythm, ear training (staged)
└── Projects     source assets, revisions, exports, engine manifests
```

The areas share identity, storage, playback, projects, and design language. They should not become independent products with duplicated libraries.

## Core user journeys

### Create a game sound

1. Create or open a project.
2. Choose an event template such as Jump, Hit, Coin, Laser, Explosion, Footstep, Magic, or UI Click.
3. Audition the preset.
4. Adjust approachable macro controls.
5. Open advanced synthesis controls if needed.
6. Trim, fade, normalize, and preview the result.
7. Save the editable patch and render an asset.
8. Export it with the project naming convention.

### Generate variations

1. Select an editable sound.
2. Choose parameters that may vary and define safe ranges.
3. Enter a variation count and seed, or request a deterministic seed.
4. Audition variations with rapid A/B controls.
5. reject, favorite, or regenerate individual results.
6. Export approved variations as a numbered group.

### Create a seamless loop

1. Import or synthesize a source.
2. Mark candidate loop boundaries.
3. Preview the boundary repeatedly.
4. Apply an optional crossfade.
5. Validate duration, sample rate, channel count, and peak level.
6. Export audio plus loop-point metadata.

### Move from theory to music

1. Select a key, scale, and tempo.
2. Explore compatible chords and hear inversions.
3. Add a progression to a pattern.
4. Create a drum and bass pattern in the sequencer.
5. Save the musical material in a project for later arrangement.

## MVP: Game Sound Lab

### Projects

The MVP must support:

- Creating, renaming, duplicating, archiving, and restoring projects.
- Project-level sample rate, channel, naming, and export defaults.
- Folders or collections for sources, patches, rendered assets, and exports.
- Autosave with visible save state and recovery after an interrupted browser session.
- A human-readable activity history for material changes and exports.

### Asset library

The library must distinguish:

- Music tracks.
- Imported samples and recordings.
- Loops.
- Procedural patches.
- Rendered sound effects.
- Instrument and effect presets.

Each asset must support a waveform or appropriate preview, duration, format, sample rate, channels, tags, notes, creation source, license/provenance, and project usage. Original imports are immutable; edits create derived revisions.

### Procedural synthesis

The first synthesis engine must provide:

- Sine, square, triangle, sawtooth, and noise sources.
- Pitch envelopes and amplitude envelopes.
- Low-pass, high-pass, and band-pass filtering.
- LFO modulation for supported parameters.
- Layering of at least four sources.
- Reverb, delay, distortion, and simple compression or limiting.
- A deterministic random seed.
- Parameter bounds that prevent invalid or dangerously loud output.
- Presets for common game-event categories.

The editable representation must be stored separately from rendered audio.

### Beginner and advanced controls

Every preset must expose a small set of descriptive macros such as Impact, Brightness, Weight, Space, Movement, and Duration. Advanced mode exposes the underlying signal parameters. Moving a macro must update the advanced values predictably and must never create an unexplained destructive change.

### Waveform editor

The MVP editor must provide:

- Waveform visualization with zoom and selection.
- Non-destructive trim and crop regions.
- Fade-in, fade-out, and crossfade.
- Gain adjustment and peak normalization.
- Zero-crossing assistance.
- Loop start/end markers and repeated loop preview.
- Undo and redo for the active editing session.
- Before/after auditioning.

Destructive source replacement, spectral repair, and multitrack editing are deferred.

### Variation generator

Users must be able to:

- Mark supported parameters as fixed or variable.
- Set minimum and maximum ranges.
- Generate a reproducible batch using a recorded seed.
- Audition results without loading separate pages.
- favorite, reject, rename, and regenerate variations.
- Prevent clipping during batch rendering.

### Export

The MVP must export:

- PCM WAV with selectable supported sample rate and bit depth.
- OGG Vorbis with a quality setting.
- Mono or stereo output.
- Individual assets or a ZIP bundle.
- Deterministic filenames such as `footstep_stone_01.wav`.
- A JSON manifest containing file, event name, duration, format, channels, sample rate, loop points, loudness/peak measurements, tags, source revision, and generation seed where applicable.

MP3, middleware-specific banks, and proprietary engine formats are deferred.

### Game-engine integration

The first supported integration should be Godot because its project format and scripting workflow are accessible to independent developers. Documentation must include:

- Importing exported WAV and OGG files.
- Loading the JSON manifest.
- Randomly selecting a variation without immediate repetition.
- Playing looped ambience using exported loop metadata.

Unity and Unreal examples can follow without changing the core export contract.

## Listen and Library requirements

The existing product must continue to support browsing, playback, search where available, playlists, favorites, saved mixes, history controls, and account-scoped state. Studio assets should use the same reliable preview infrastructure without appearing in the user's music library unless explicitly added.

Player improvements supporting Studio include waveform preview, A/B playback, exact time display, looping a selection, and fast switching between variations.

## Music theory workspace

The first Theory release should provide:

- An interactive piano keyboard.
- Notes, intervals, major/minor scales, modes, and scale degrees.
- Triads, seventh chords, inversions, and chord symbols.
- A circle of fifths linked to audible examples.
- Key and scale highlighting shared with the sequencer.
- Suggested compatible chords with explanations rather than certainty claims.
- Ear-training exercises for intervals, chords, and rhythm.
- MIDI keyboard input where browser support permits it.

Theory tools must create reusable musical objects, not only display lessons. A chord progression created in Theory should open in Compose without re-entry.

## Compose roadmap

Compose is staged after the Game Sound Lab proves the audio engine.

### Step sequencer

- Configurable tempo, time signature, pattern length, swing, and metronome.
- Drum lanes with velocity and per-step probability.
- Pattern duplication and simple chaining.
- Sample selection from the project library.

### Piano roll and instruments

- Note create, move, resize, duplicate, quantize, velocity, and audition.
- Scale-aware highlighting without preventing chromatic notes.
- Initial subtractive synthesizer for bass, lead, pad, and pluck presets.
- MIDI import/export after the internal event model is stable.

### Arrangement and mixer

- Timeline of patterns and audio regions.
- Volume, pan, mute, solo, sends, and a master output.
- Automation for an intentionally limited first set of parameters.
- Stem and mixdown export.

## Adaptive game music

A later Adaptive Music workspace should model named game states such as Exploration, Suspense, Combat, and Victory. Users can assign compatible loops or stems, define transition rules, preview state changes, and export stems plus a JSON state/transition manifest.

The first release should use bar-aligned and beat-aligned transitions. Advanced middleware, runtime DSP graphs, and engine-specific authoring are deferred.

## AI-assisted workflows

Candidate capabilities include:

- Turning “short retro coin with a soft tail” into editable parameter suggestions.
- Explaining the synthesis behind the active sound.
- Suggesting bounded variations.
- Suggesting chord progressions, bass patterns, or drum patterns in the selected key and style.
- Detecting BPM, key, loop candidates, and useful tags for imported audio.
- Generating project names, export names, and metadata descriptions.

AI must:

- Be optional and explicitly enabled.
- Show what project data will be sent to an external provider.
- Produce editable suggestions rather than silently rendered truth.
- Require confirmation before changing a project.
- Preserve provider, model, prompt intent, accepted parameters, and seed where useful for provenance.
- Avoid requests to imitate a living artist or reproduce protected recordings.
- Fail gracefully while manual synthesis, theory, editing, and export remain available.

The deterministic synthesis engine—not the AI response—is the source of truth for reproducible sounds.

## Audio and interaction requirements

- Use the Web Audio API for low-latency browser audition and graph-based synthesis.
- Perform expensive rendering, waveform analysis, and encoding outside the main UI thread.
- Clearly distinguish live preview quality from final rendered output when they differ.
- Prevent unexpected loudness with conservative defaults, master limiting, meters, and a user-controlled preview level.
- Suspend audio when required by browser lifecycle rules and recover clearly.
- Display progress and support cancellation for long renders and batch exports.
- Preserve editing state when a render or network request fails.

Initial supported browsers should be Chromium-based desktop browsers. Broader support requires measured compatibility, especially for Web Audio, Web MIDI, codecs, and file access.

## Accessibility

- Every transport, editing, and export action must be keyboard reachable.
- Controls need visible focus, labels, values, and non-color state indicators.
- Waveforms and meters require textual duration, level, selection, and marker alternatives.
- Animation must respect reduced-motion preferences.
- Shortcuts must be discoverable and avoid browser or assistive-technology conflicts.
- Ear-training results must not be required to navigate or operate the product.

## Future visual themes

User-selectable theme packs are a post-MVP customization feature. Planned directions include:

- **Studio Dark:** a restrained production interface optimized for long editing sessions.
- **Retro:** hardware-sampler and arcade-inspired colors, typography, meters, and optional display texture.
- **Cyberpunk:** high-contrast neon accents and futuristic panel styling.
- **High Contrast:** an accessibility-focused palette with minimal decorative effects.
- Additional community or project themes after the theme contract is stable.

The foundation must use semantic design tokens and CSS custom properties now so later themes can change color, typography, spacing accents, meters, waveforms, and decorative treatment without changing component behavior or layout contracts.

Theme requirements:

- Theme selection persists per user and applies before meaningful paint.
- Every theme maintains readable waveforms, automation data, focus states, meters, warnings, and disabled controls.
- Retro scanlines, glow, flicker, animated noise, and similar effects are optional decoration and disabled by reduced-motion or reduced-transparency preferences.
- A theme may not encode musical or editing state by color alone.
- Theme packs contain declarative tokens and approved assets, not executable third-party code.
- The default theme remains available as a safe fallback when a theme is incomplete or incompatible.
- Audio output, saved projects, screenshots used for visual testing, and export rendering remain independent of the selected UI theme.

Themes should be tested against representative dense screens—including the waveform editor, patch controls, sequencer, mixer, dialogs, and error states—rather than only the landing page.

## Data model

The conceptual model is:

```text
User
└── Project
    ├── SourceAsset
    ├── Patch ── PatchRevision ── RenderedAsset
    ├── Pattern ── MusicalEvents
    ├── ExportBundle ── ExportedFiles + Manifest
    └── ActivityEvent
```

Rendered files must reference the exact source or patch revision, renderer version, parameters, and seed needed for provenance. Large binary assets belong in object or filesystem storage; relational data stores metadata, ownership, revisions, and relationships.

## Technical architecture direction

Begin with clear modules rather than one microservice per feature:

```text
Browser
├── React application shell
├── Web Audio preview engine
└── worker-based analysis/render coordination
        │
        ▼
Go API
├── identity and authorization
├── projects and metadata
├── asset catalog and provenance
├── export orchestration
└── optional AI adapter
        │
        ├── MySQL metadata
        ├── media/object storage
        └── asynchronous render workers (when needed)
```

The current web and API deployments remain the initial boundaries. Introduce a render worker only when server-side encoding, analysis, or batch workloads justify independent scaling. Do not split Theory, Compose, Sound Lab, and Library into separate network services by default.

## Recommended tools and technology

The Studio should add a small number of audio-focused tools while retaining the current application stack. Audio libraries must sit behind project-owned interfaces so patches and projects are not permanently coupled to one dependency's object model.

### Browser audio and music

| Need                                                                 | Recommended tool                                | How we should use it                                                                                                                                                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core audio graph and preview                                         | Web Audio API                                   | Treat `AudioContext`, audio nodes, and scheduled `AudioParam` changes as the platform foundation. Keep one managed context per page.                                                                      |
| Custom real-time DSP                                                 | `AudioWorklet`                                  | Use for DSP that built-in nodes cannot provide. Do not use deprecated `ScriptProcessorNode`. Keep UI and network work outside the audio thread.                                                           |
| Deterministic offline rendering                                      | `OfflineAudioContext`                           | Render Web Audio graphs faster than real time into an `AudioBuffer`; record renderer version, parameters, sample rate, and seed.                                                                          |
| Musical clock, sequencing, synth building blocks, and common effects | Tone.js                                         | Use initially for transport, tempo-relative scheduling, envelopes, oscillators, instruments, and effects. Wrap it in a Studio audio-engine adapter rather than storing Tone objects in project documents. |
| Waveform display and editable regions                                | wavesurfer.js with Regions and Timeline plugins | Use for visualization, selection, markers, and loop-region interaction. Project edit data remains the source of truth. Supply precomputed peaks for large assets.                                         |
| Heavy non-real-time browser work                                     | Web Workers                                     | Run peak generation, WAV serialization, analysis, and archive preparation outside the React/UI thread. Workers must be cancellable.                                                                       |
| MIDI controller input                                                | Web MIDI API                                    | Add during Theory/Compose behind capability detection, explicit permission, and keyboard-accessible alternatives.                                                                                         |

Tone.js accelerates the MVP, but native Web Audio remains the architectural boundary. If Tone.js cannot reproduce an important graph consistently in offline rendering, that graph should move to project-owned Web Audio or AudioWorklet DSP rather than changing the saved project format.

### Rendering, encoding, and analysis

| Need                                            | Recommended tool                                             | How we should use it                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First PCM export                                | Small project-owned WAV encoder                              | Serialize an offline-rendered `AudioBuffer` to PCM WAV in a worker. WAV is simple enough that the MVP should not add a large browser codec bundle for it.  |
| Canonical OGG encoding, probing, and validation | Pinned FFmpeg container                                      | Run FFmpeg as an isolated, non-root, resource-limited job. Pass validated argument arrays without a shell. Use `ffprobe` output to verify format metadata. |
| Peak, loudness, clipping, and loop validation   | Project-owned analysis module; FFmpeg where appropriate      | Keep simple peak/RMS calculations deterministic and testable. Add standardized loudness measurement only when its product target is defined.               |
| ZIP bundles                                     | A small maintained ZIP library in a Web Worker or render job | Stream files where possible and enforce total output limits. Do not retain duplicate temporary bundles indefinitely.                                       |
| Future musical/audio analysis                   | Evaluate Essentia.js behind an adapter                       | Consider only after BPM, key, or feature-extraction accuracy is benchmarked against representative game audio. It is not needed for the Sound Lab MVP.     |

The first preview and PCM render can remain in the browser. Introduce the FFmpeg render worker with OGG export or earlier if browser output differs across supported machines. The worker is a queue consumer, not a public API: the Go API authorizes a render request, stores a job, and exposes status and signed/authorized results.

### Application and data stack

| Area                  | Tool or approach                                                                          | Decision                                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI                    | React, TypeScript, Vite                                                                   | Continue the existing stack. Split Studio routes and editor components by capability rather than creating another frontend.                                   |
| Server state          | TanStack Query                                                                            | Continue using it for projects, assets, revisions, jobs, and exports. Audio playback/edit state does not belong in the query cache.                           |
| Runtime validation    | Zod in the browser and strict Go decoding on the API                                      | Version project documents and validate every imported document or manifest. Generate fixtures from shared examples where practical.                           |
| Editor state and undo | Project-owned command model with immutable snapshots                                      | Start without a global-state dependency. Add a focused state library only after the editor model and performance needs are measured.                          |
| API                   | Go `net/http`                                                                             | Extend the current versioned API with projects, assets, upload sessions, revisions, render jobs, and exports. Keep authorization at every ownership boundary. |
| Metadata              | MySQL migrations                                                                          | Store users, projects, asset metadata, patch revisions, job state, provenance, and export records—not large audio blobs.                                      |
| Binary storage        | Storage interface backed initially by the existing filesystem/PVC                         | Define `Put`, `Open`, `Stat`, and `Delete` semantics plus content hashes. Add S3-compatible storage later without changing domain APIs.                       |
| Background jobs       | MySQL-backed job table and separate Go worker process when required                       | Begin with one worker deployment and bounded concurrency. Do not add Kafka, RabbitMQ, or Redis for the MVP.                                                   |
| API contracts         | OpenAPI generated from or checked against implementation after Studio endpoints stabilize | Keep Zod and Go behavior tested immediately; add contract generation before external engine integrations depend on the API.                                   |

### Testing and quality tools

| Test layer                 | Tools and coverage                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure DSP and project rules | Vitest for envelopes, parameter bounds, seed behavior, naming, edit commands, manifests, and WAV serialization.                                                       |
| Browser audio integration  | Playwright in Chromium using generated impulses, tones, and noise. Verify decoded duration, peaks, loop boundaries, and user journeys.                                |
| Audio regression           | Deterministic rendered PCM fixtures compared by numeric tolerance and selected signal features, not only byte hashes. Store only small disposable/generated fixtures. |
| API and persistence        | Existing Go unit/integration tests with MySQL for ownership, revision conflicts, quotas, job transitions, and recovery.                                               |
| Export validation          | `ffprobe` plus automated checks for filenames, manifest/file agreement, sample rate, channels, duration, loop points, and clipping.                                   |
| Security                   | Existing secret, dependency, source, container, and Kubernetes scans plus malicious media/project fixtures and resource-exhaustion tests.                             |
| Engine integration         | A minimal versioned Godot sample project exercised against exported bundles in CI where practical.                                                                    |
| Performance                | Browser performance marks around preview start, waveform load, autosave, offline render, and export; server metrics around upload and job queues.                     |

Testing should prefer generated audio with known mathematical properties. Copyrighted or opaque binary fixtures must not enter Git.

### Product and design tools

- Use Storybook only when shared editor controls become numerous enough to justify a separate component workbench; it is not required for the first prototype.
- Use Figma or repository-native wireframes for piano roll, waveform, patch, and export interaction review before implementing dense editor screens.
- Use Architecture Decision Records under `docs/decisions/` for renderer ownership, saved patch schema, object storage, and job queue decisions.
- Publish the JSON export manifest as a versioned JSON Schema so Godot, Unity, and Unreal examples can validate it independently.

## Existing capabilities we can leverage now

The current codebase already solves meaningful platform work. Studio development should extend these assets instead of restarting the product.

### Existing browser foundation

- React, TypeScript, Vite, routing, and responsive application structure.
- A working `HTMLAudioElement` player with play/pause, seek, queue, repeat, shuffle, volume, and session restoration behavior.
- TanStack Query for server state and Zod for response validation.
- Account-aware library, playlist, history, mixes, and recommendation interfaces.
- Vitest component/hook tests and Playwright critical-journey tests.
- A deterministic generated WAV fixture that can become the basis for broader audio tests.

The current player should continue handling ordinary music playback. Studio preview needs a separate managed Web Audio engine; replacing the player wholesale would create unnecessary regression risk.

### Existing API and data foundation

- Go API with strict JSON input, request limits, structured logs, and request IDs.
- Persistent cookie sessions, bcrypt password hashing, CSRF protection, origin checks, ownership enforcement, and rate limits.
- MySQL migrations and integration tests that exercise real persistence and session recovery.
- A narrow media-serving allowlist that can inform authorized asset-download handlers.
- Local and optional AI recommendation adapters that demonstrate provider isolation and validated output.
- Liveness and readiness endpoints suitable for additional worker and storage checks.

The static catalog is not sufficient for Studio projects, but its separation from the filesystem provides a useful migration boundary toward database-owned asset metadata.

### Existing delivery and operations foundation

- Non-root, read-only containers with dropped capabilities and resource limits.
- Docker Compose for local development and disposable testing.
- Kubernetes manifests with health probes, restricted security contexts, service accounts, persistent claims, and network policies.
- Change-aware GitHub Actions for Go, frontend, browser, manifest, security, and image checks.
- Multi-architecture image publishing with immutable commit tags.
- Argo CD reconciliation through the automation-owned `deploy/test` and
  `deploy/production` branches.
- Local persistent application and Argo CD endpoints without routine port forwarding.
- Documentation for secrets, media import, backup, rollback, troubleshooting, and cluster recovery.

The first Studio milestone can therefore focus on audio and project behavior. It does not need to redesign authentication, deployment, container security, or GitOps.

### What needs extension rather than replacement

| Current capability            | Studio extension                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Static catalog                | User-owned asset metadata, tags, provenance, derived revisions, and project usage.                 |
| Read-only media directory/PVC | Authorized upload flow and a storage interface supporting sources, previews, renders, and exports. |
| `HTMLAudioElement` player     | Web Audio preview engine for synthesis, regions, precise scheduling, and A/B audition.             |
| Playlists and saved mixes     | Projects, patterns, patch revisions, variation groups, and export bundles.                         |
| Synchronous API requests      | Bounded background jobs with progress, cancellation, retries, and idempotency.                     |
| Disposable WAV E2E fixture    | Generated DSP fixtures, render tolerances, export probing, and golden signal tests.                |
| One API/web deployment        | Optional render-worker deployment only when encoding or batch workloads require it.                |

### Tools deliberately deferred

Do not add these until a measured need exists:

- A microservice per Studio area.
- Kafka, RabbitMQ, Redis, or a workflow orchestrator.
- WebAssembly codec bundles duplicating the canonical FFmpeg worker.
- Collaborative-document infrastructure such as CRDTs.
- Third-party plugin hosting.
- A custom database, time-series database, or search cluster.
- Native desktop wrappers.
- GPU infrastructure or self-hosted generative-audio models.

Deferral is not rejection. Each tool should enter through an explicit requirement, benchmark, and architecture decision rather than anticipation.

### Storage

- Original uploads and imports are immutable.
- Editable patches and project documents use versioned schemas.
- Rendered assets are content-addressable where practical to avoid duplicates.
- Exports are reproducible from retained project revisions when the renderer version remains available.
- User-configurable retention cleans temporary previews without deleting sources or approved exports.
- Backup and restore cover database metadata and binary storage as one consistent recovery point.

### Security

- Validate file type using content, not filename alone.
- Limit upload size, decoded duration, channel count, sample rate, graph complexity, and batch count.
- Treat imported project and manifest files as untrusted data.
- Isolate rendering and encoding jobs with non-root, resource-limited workloads.
- Never execute uploaded plugins or scripts.
- Scan dependencies, images, source, and secrets in CI.
- Keep licensed media, user projects, exports, and credentials outside Git.

## Delivery strategy

### Phase 0: approve and prototype

- Approve this PRD and resolve blocking decisions.
- Measure current player reliability, browser support, and media performance.
- Prototype Web Audio synthesis, deterministic offline rendering, waveform visualization, and WAV export.
- Validate browser audio behavior on the target development machines.

### Phase 1: Studio foundation

- Add projects, expanded asset types, storage abstraction, provenance, and autosave.
- Add waveform preview and project-level asset organization.
- Preserve all current Listen workflows through migration tests.

### Phase 2: Game Sound Lab MVP

- Deliver procedural synthesis, presets, macro/advanced controls, waveform editing, variation generation, WAV/OGG export, and JSON manifests.
- Publish a Godot integration example.
- Complete the first end-to-end “create to game” journey.

### Phase 3: Theory and sequencing

- Deliver scale/chord tools, interactive keyboard, step sequencer, and reusable musical objects.
- Add initial instruments and project patterns.

### Phase 4: Composition

- Add piano roll, arrangement, mixer, automation, MIDI exchange, and stem export.

### Phase 5: Adaptive audio and AI

- Add state-based music transitions and engine manifests.
- Introduce approved AI assistants only after deterministic workflows are stable.

### Phase 6: Customization and theme packs

- Deliver Studio Dark, Retro, Cyberpunk, and High Contrast themes using the stable semantic-token contract.
- Add per-user theme persistence, pre-paint application, visual regression coverage, and accessibility validation.
- Document a constrained theme-pack format before accepting community themes.

## MVP acceptance criteria

The Game Sound Lab MVP is complete when:

- A new user can create, preview, save, reopen, and export a game sound from a preset.
- Reopening a patch produces the same audio from the same renderer version and seed within documented tolerances.
- A user can generate at least eight bounded variations and export selected results as a numbered bundle.
- An imported or generated sound can be trimmed, faded, normalized, looped, and previewed without replacing its source.
- WAV and OGG exports pass automated format validation and avoid clipping under supported presets.
- The JSON manifest matches every exported file and records loop/provenance data.
- The Godot example loads a bundle, selects variations, and plays a loop correctly.
- Autosave recovers the most recent valid project state after an interrupted session.
- Existing player, authentication, library, playlist, and history critical journeys still pass.
- Keyboard-only users can complete the create, edit, and export flow.
- Malformed, oversized, or excessive input is rejected without destabilizing the service.
- Backup restoration recovers project metadata and binary assets together.

## Measures to baseline before OKRs

- Time from first project creation to first valid export.
- Percentage of users completing the preset-to-export journey.
- Number of saved patches, approved variations, and exports per active project.
- Preview start latency and final render duration by asset length.
- Autosave recovery success and project corruption rate.
- Export validation failure rate.
- Existing music-player regression and playback failure rates.
- Godot example completion rate from documentation testing.
- Accessibility and keyboard-flow defects.
- AI suggestion acceptance, editing, and rejection rates when AI is enabled.

## Risks and mitigations

| Risk                                              | Mitigation                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Scope expands into a full DAW too early           | Ship Game Sound Lab first and gate later phases on usage evidence.                   |
| Browser audio differs across devices              | Pin supported browsers initially and add audio golden tests with tolerances.         |
| Live preview and export sound different           | Share DSP definitions and clearly version the renderer.                              |
| Heavy rendering freezes the interface             | Use workers, cancellation, bounded graphs, and server jobs only when justified.      |
| Randomization produces unusable output            | Use parameter constraints, conservative presets, metering, and deterministic seeds.  |
| User projects become unreproducible               | Store patch revisions, engine version, parameters, sources, and seeds.               |
| Uploaded media creates security or licensing risk | Validate content, sandbox processing, and record user-declared provenance.           |
| AI obscures authorship or reproducibility         | Keep AI optional and persist accepted editable parameters rather than opaque output. |
| New Studio work breaks the music player           | Preserve critical player journeys and migrate incrementally.                         |

## Open decisions for review

1. Is the primary launch user a game developer, a learning producer, or both with equal priority?
2. Is Godot the correct first engine integration?
3. Should final rendering happen entirely in-browser initially, or should the MVP include a server render worker?
4. Which sample rates, WAV bit depths, and OGG quality range are required for MVP?
5. What maximum source duration, upload size, layer count, and variation batch size should local deployments support?
6. Do projects belong to one user initially, or should collaboration permissions exist in the data model from the start?
7. Should imported samples be allowed in procedural patches at MVP, or only synthesized sources?
8. Is MIDI keyboard input required for the Theory release or optional based on browser support?
9. Which object-storage implementation should replace or extend the current media PVC?
10. Which AI providers, if any, meet the desired privacy and reproducibility requirements?

## Review and approval checklist

Approve the PRD when reviewers agree on:

- Bedlam-Like-Music Studio as the product direction.
- Game Sound Lab as the first creation MVP rather than a full DAW.
- The create, vary, edit, export, and Godot integration journeys.
- Reproducibility, provenance, storage, security, and accessibility requirements.
- The staged sequence: Foundation → Sound Lab → Theory/Sequencer → Composition → Adaptive Audio/AI.
- The open decisions that must be resolved before estimates and OKRs.

## Technical references

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio specification](https://www.w3.org/TR/webaudio-1.0/)
- [Tone.js documentation](https://tonejs.github.io/)
- [wavesurfer.js documentation](https://wavesurfer.pages.dev/)
- [FFmpeg documentation](https://www.ffmpeg.org/documentation.html)
