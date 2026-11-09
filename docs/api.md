# HTTP API reference

The application API is served under `/api/v1`. Through Compose or Kubernetes,
use the web origin (`http://localhost:8080`) so cookies, CSRF protection, and
proxy behavior match the application. API health endpoints are direct service
endpoints used by container and Kubernetes probes; nginx does not proxy them.

## Conventions

- JSON request bodies require `Content-Type: application/json`.
- Unknown JSON fields, multiple JSON objects, and bodies over 16 KiB are
  rejected.
- Errors use `{"error":{"code":"...","message":"..."}}`.
- Every API response includes `X-Request-ID` for log correlation.
- Authenticated mutations require the `blm_session` cookie and
  `X-CSRF-Token` header.
- Authentication endpoints are rate-limited.

## Health and media

| Method | Path                    | Purpose                                    |
| ------ | ----------------------- | ------------------------------------------ |
| GET    | `/health/live`          | API process liveness                       |
| GET    | `/health/ready`         | API and database readiness                 |
| GET    | `/health/web`           | nginx health through the web service       |
| GET    | `/media/music/{file}`   | audio file from configured media storage   |
| GET    | `/media/artwork/{file}` | artwork file from configured media storage |

## Public endpoints

| Method | Path                    | Purpose                                                      |
| ------ | ----------------------- | ------------------------------------------------------------ |
| GET    | `/api/v1/catalog?q=`    | list or search catalog songs                                 |
| GET    | `/api/v1/auth/session`  | return current user and CSRF token, or an anonymous response |
| POST   | `/api/v1/auth/register` | create account and session                                   |
| POST   | `/api/v1/auth/login`    | create session for an existing account                       |

Registration accepts `username`, `name`, and `password`. Usernames are 3–32
lowercase letters, numbers, or underscores. Passwords are 12–72 bytes.

## Authenticated endpoints

| Method | Path                          | Purpose                                  |
| ------ | ----------------------------- | ---------------------------------------- |
| POST   | `/api/v1/auth/logout`         | revoke current session                   |
| GET    | `/api/v1/playlists`           | list owned playlists and saved mixes     |
| POST   | `/api/v1/playlists`           | create playlist                          |
| PUT    | `/api/v1/playlists/{id}`      | update owned playlist                    |
| DELETE | `/api/v1/playlists/{id}`      | delete owned playlist                    |
| GET    | `/api/v1/likes`               | list liked song IDs                      |
| PUT    | `/api/v1/likes/{songId}`      | like a catalog song; idempotent          |
| DELETE | `/api/v1/likes/{songId}`      | unlike a song; idempotent                |
| GET    | `/api/v1/history`             | list history and current history setting |
| POST   | `/api/v1/history/{songId}`    | record a play when history is enabled    |
| PUT    | `/api/v1/history/settings`    | set history with `{"enabled":true}`      |
| DELETE | `/api/v1/history`             | clear owned history                      |
| POST   | `/api/v1/mixes/preview`       | generate a temporary mood mix            |
| POST   | `/api/v1/mixes`               | save a generated mix                     |
| PUT    | `/api/v1/mixes/{id}/feedback` | rate an owned saved mix                  |

Song identifiers are validated against the checked-in catalog. Ownership is
derived from the session; user IDs supplied by clients are not trusted.

## Cookie and CSRF example

```bash
curl -sS -c /tmp/bedlam-like-music.cookies \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:8080' \
  -d '{"username":"listener","name":"Listener","password":"use-a-long-password"}' \
  http://localhost:8080/api/v1/auth/register

# Read csrfToken from this response.
curl -sS -b /tmp/bedlam-like-music.cookies \
  http://localhost:8080/api/v1/auth/session

curl -i -b /tmp/bedlam-like-music.cookies \
  -X PUT \
  -H 'Origin: http://localhost:8080' \
  -H 'X-CSRF-Token: <token-from-session>' \
  http://localhost:8080/api/v1/likes/1
```

The API is currently application-internal rather than a public SDK contract.
Update this document and integration tests whenever routes or payloads change.
