# Bedlam-Like-Music

A browser-based studio for exploring sound: make a synth patch, record or import a sample, shape it, and learn the music behind it. The project also provides a local Kubernetes lab for practicing GitOps delivery from development to a production rehearsal.

[Get started](#get-started) · [Studio guide](docs/studio.md) · [Documentation](docs/README.md)

## What you can do

- Create sounds with a two-oscillator synthesizer, harmonic shaping, envelopes, filter modulation, and distortion.
- Render a synth note to the sample editor; trim it, adjust level or speed, and save a WAV copy.
- Record or import audio, organize samples into albums, and play or layer them in a simple mixer.
- Explore major and natural minor scales and hear notes and chords in different keys.
- Experiment with sound matching: analyze a short recording and hear a synthesized approximation.

Samples and synth settings are stored **in the current browser**, not synchronized to an account. Clearing browser data may remove them; keep your original audio files. Sound matching is experimental and cannot faithfully reproduce every sound.

## Get started

You need Docker Desktop with Compose and a browser. From the repository root:

```sh
cp .env.example .env
mkdir -p assets/music assets/images/artwork
```

Set your own `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` in `.env`, then run:

```sh
docker compose up --build
```

Open [localhost:8080](http://localhost:8080). The studio does not require preloaded music files; microphone recording asks for browser permission. Compose also starts MySQL and the existing API. Stop it with `docker compose down`.

For synth controls, sample editing, storage limits, and sound matching, see the [studio guide](docs/studio.md). For native development and tests, see [development](docs/development.md).

## Kubernetes lab

The local lab uses separate test and production-rehearsal environments. Features flow through `development` to test; promotion to `master` deploys the production rehearsal. Both run locally and are intended for deployment practice.

| Service                      | Local address                            |
| ---------------------------- | ---------------------------------------- |
| Test app                     | [localhost:8080](http://localhost:8080)  |
| Test Argo CD                 | [localhost:8082](https://localhost:8082) |
| Production-rehearsal app     | [localhost:8083](http://localhost:8083)  |
| Production-rehearsal Argo CD | [localhost:8084](https://localhost:8084) |
| Grafana, if installed        | [localhost:3000](http://localhost:3000)  |

The addresses are available only after the relevant services are installed and running. Compose and the test cluster both use port 8080; stop one before starting the other. Start with [Argo CD setup](docs/argo-cd.md), [GitHub Actions](docs/github-actions.md), and [observability](docs/observability.md).

## Documentation

| Guide                                         | Contents                                           |
| --------------------------------------------- | -------------------------------------------------- |
| [Studio](docs/studio.md)                      | Synth, samples, editing, theory, and local storage |
| [Development](docs/development.md)            | Local setup, checks, and browser tests             |
| [Architecture](docs/architecture.md)          | Browser, API, storage, and deployment boundaries   |
| [Deployment](docs/deployment-environments.md) | Local environments and limitations                 |
| [Operations](docs/operations.md)              | Health checks, backup, and recovery                |
| [Documentation index](docs/README.md)         | All guides, including API and security             |

Audio, artwork, credentials, and local planning documents are excluded from Git. Use only media you have permission to use. No open-source license has been declared for this repository.
