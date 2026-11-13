# Web and audio working context

Read the repository-root `CODEX.md` first.

## Responsibility

Current studio: browser-only sample library/editor/mixer, polyphonic synthesis,
bounded phrase recording and WAV rendering, and music theory. Samples persist in
IndexedDB; unsaved phrase events remain session-only. The unused legacy player/Go/MySQL stack is removed under STUDIO-CLEANUP-001. Do not add server dependencies for these features.

The React application provides Listen, Library, Sound Lab, Theory, Compose,
and Projects as staged capabilities in one coherent product.

## Current foundation to preserve

- React, TypeScript, Vite, React Router, and Zod.
- Current synth, sample editor/mixer, phrase recording, theory, and local persistence.
- Vitest and Playwright tests, including generated disposable audio.

## Studio direction

- Keep synthesis and precise audio preview inside project-owned Web Audio adapters.
- Use native Web Audio as the boundary. Tone.js and wavesurfer.js must sit
  behind project-owned adapters and must not define the saved project schema.
- Use `AudioWorklet` for necessary custom real-time DSP,
  `OfflineAudioContext` for offline rendering, and Web Workers for heavy
  non-real-time processing.
- Model editor changes as commands so undo, redo, autosave, and recovery share
  one predictable state transition path.
- Keep real-time audio nodes outside React state; no server-state cache is required.

## Design and accessibility

- Support complete keyboard operation and visible focus.
- Never encode editing state by color alone.
- Use semantic design tokens now. Retro, Cyberpunk, Studio Dark, and High
  Contrast selectable themes are post-MVP.
- Respect reduced motion and ensure waveforms, meters, warnings, and disabled
  controls remain legible in every future theme.

## Required validation

Run formatting/linting, TypeScript build, focused Vitest tests, and relevant
Playwright journeys. Audio regression tests should use generated signals and
numeric tolerances rather than copyrighted fixtures.
