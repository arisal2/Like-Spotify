# Web and audio working context

Read the repository-root `CODEX.md` first.

## Responsibility

The React application provides Listen, Library, Sound Lab, Theory, Compose,
and Projects as staged capabilities in one coherent product.

## Current foundation to preserve

- React, TypeScript, Vite, React Router, TanStack Query, and Zod.
- Existing player behavior: queue, seek, repeat, shuffle, volume, playback
  recovery, playlists, history, and account-scoped state.
- Vitest and Playwright tests, including generated disposable audio.

## Studio direction

- Keep ordinary music playback on the existing player while introducing a
  separately managed Web Audio engine for synthesis and precise preview.
- Use native Web Audio as the boundary. Tone.js and wavesurfer.js must sit
  behind project-owned adapters and must not define the saved project schema.
- Use `AudioWorklet` for necessary custom real-time DSP,
  `OfflineAudioContext` for offline rendering, and Web Workers for heavy
  non-real-time processing.
- Model editor changes as commands so undo, redo, autosave, and recovery share
  one predictable state transition path.
- Keep server state in TanStack Query; do not put real-time playback or editor
  state in its cache.

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
