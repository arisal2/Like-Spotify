# Like

An independent music-listening project built with Go, React, and Kubernetes.
Browse a small catalog, keep playlists and favorites, and turn a mood into a
playable mix.

## What you can do

- Play, seek, shuffle, repeat, and resume a queue on the same device.
- Create an account, like tracks, and organize playlists.
- Review or clear your private listening history, or turn it off entirely.
- Generate, adjust, save, and rate a mood mix. Local recommendations work
  without an AI provider.

## Get started

You need Docker Desktop with Compose. Music and artwork are stored separately
from Git and container images. Place licensed files in `assets/music/` and
`assets/images/artwork/`, using the filenames listed in
[`songs.json`](backend/internal/catalog/songs.json). Without them, the catalog
loads but media playback and artwork are unavailable.

```bash
cp .env.example .env
# Set your own database passwords in .env.
docker compose up --build
```

Open <http://localhost:8080>. Compose keeps database data in a named volume;
`docker compose down` stops the services without deleting it. Set `MEDIA_PATH`
in `.env` to mount media from a different local directory.

## How it fits together

```text
Browser → React / nginx → Go API → MySQL
                               ↘ media storage
                               ↘ optional AI provider
```

The Go API owns sessions, playlists, listening history, and mix generation.
React handles browsing and playback. Local mood matching uses catalog tags;
when configured, the AI provider receives the prompt and catalog metadata,
and the API validates its result against the catalog. Account details and
listening history are not included in the provider request.

## Kubernetes and delivery

The local cluster uses GitOps: after a change to `master` passes CI, GitHub
Actions publishes the API and web images and promotes their tested revision to
`deploy/local`. Argo CD watches that branch, runs the migration hook, and syncs
the workloads into the `like-spotify` namespace.

- [Set up Argo CD and the local cluster](docs/argo-cd.md)
- [Set up and troubleshoot GitHub Actions](docs/github-actions.md)

On Docker Desktop, the app is at <http://localhost:8080> and Argo CD is at
<https://localhost:8082>. Docker Desktop and Kubernetes must be running. The
local services may be reachable from your network depending on Docker Desktop's
network settings.

## Development checks

```bash
cd backend
go test -race ./...
go vet ./...

cd ../web
npm ci
npm run lint
npm test
npm run build
```

For browser tests, start the Compose stack with media available, then run
`npx playwright install chromium` and `npm run test:e2e` from `web/`.

## Security and media

Passwords are hashed; session cookies, CSRF checks, and server-side ownership
checks protect account operations. Secrets and local media are excluded from
Git. Kubernetes workloads use non-root containers and network policies. See
[SECURITY.md](SECURITY.md) for reporting and deployment guidance.

The `media-backup/` directory is ignored by Git and Docker. It is still on the
same machine, so keep another backup elsewhere. Ensure you have the rights and
attribution required for every audio track and image you supply.
