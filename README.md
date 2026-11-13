# Bedlam-Like-Music

A browser-based studio for creating and exploring sound. Build synth patches, work with samples, and learn music theory in one workspace.

## Studio

- **Synthesizer:** combine oscillators, harmonics, filters, envelopes, and effects.
- **Samples:** record or import audio, edit a waveform, and layer sounds in a simple mixer.
- **Sound matching:** experiment with synthesizing an approximation of a short recording.
- **Music theory:** explore and hear scales, notes, and chords.

Studio samples and settings are stored in your browser. See the [studio guide](docs/studio.md) for instructions and storage details.

## Getting started

The studio uses React, TypeScript, and native browser audio, served by nginx. No backend or database is required. Start with the [development guide](docs/development.md) for setup and testing.

## Deployment

The Kubernetes lab practices GitOps delivery through separate test and production-rehearsal environments. See the [deployment guide](docs/deployment-environments.md) and [Argo CD setup](docs/argo-cd.md).

## Documentation

- [Studio guide](docs/studio.md)
- [Development and testing](docs/development.md)
- [Architecture](docs/architecture.md)
- [GitHub Actions and GitOps](docs/github-actions.md)
- [Operations](docs/operations.md)
- [All documentation](docs/README.md)

Use only media you have permission to use. No open-source license has been declared for this repository.
