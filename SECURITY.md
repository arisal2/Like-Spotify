# Security Policy

## Supported version

Security fixes are applied to the latest revision on the default branch. This
project does not currently maintain older release lines.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature when it is available for
this repository. Include the affected endpoint or component, reproduction
steps, expected impact, and any suggested mitigation.

Do not include credentials, personal data, or working exploits in a public
issue. If private reporting is unavailable, open a minimal public issue asking
the maintainer for a private contact channel.

## Deployment baseline

- Terminate TLS before the web service and set `APP_ENV=production`,
  `APP_ORIGIN=https://your-domain`, and `COOKIE_SECURE=true`.
- Keep Kubernetes secrets outside Git and rotate database and API credentials
  after any suspected exposure.
- Use a CNI that enforces Kubernetes `NetworkPolicy`; the manifests default-deny
  traffic and permit only the required web, API, database, DNS, and AI paths.
- Run the GitOps overlay with immutable commit-SHA image tags and retain the CI
  vulnerability, secret, and misconfiguration scans as required checks.
- Apply the restricted Pod Security Standard and do not grant workloads RBAC,
  host namespaces, privileged mode, or writable root filesystems.
