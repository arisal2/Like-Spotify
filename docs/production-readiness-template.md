# Production readiness review template

Copy this template into a release issue or change record. Every required item
needs an owner, evidence link, and Producer approval. An unchecked required item
blocks an externally hosted production launch. The shared Docker Desktop
production worker is a local rehearsal; it does not satisfy this launch review.

## Release identity

- Candidate `deploy/test` SHA:
- API image digest:
- Web image digest:
- Planned production date:
- Release owner:
- Rollback owner:
- Producer approval:

## Platform and isolation

- [ ] Remote production cluster and account are separate from Docker Desktop and test.
- [ ] Production namespace, workload identity, RBAC, and network policies were reviewed.
- [ ] Node pools, resource quotas, disruption budgets, autoscaling, and capacity were tested.
- [ ] Argo CD production access is restricted to approved sources, destinations, and resource kinds.
- Evidence/owner:

## Data and storage

- [ ] Managed or independently backed-up MySQL uses encryption and least-privilege credentials.
- [ ] Media uses durable object storage or storage with documented backup and restore behavior.
- [ ] Migration forward and rollback behavior was exercised against production-like data.
- [ ] Browser-local storage limits and source-media backup expectations are documented.
- [ ] Any future durable project storage has approved restore objectives and tested recovery.
- RPO/RTO, evidence, and owner:

## Secrets and supply chain

- [ ] External secret management and rotation are configured; no production secret is stored in Git.
- [ ] Images are immutable and include SBOM and provenance attestations.
- [ ] CI, dependency review, Dependabot, `govulncheck`, npm audit, and Trivy pass.
- [ ] Third-party Actions are pinned or explicitly reviewed, and license exceptions are documented.
- Evidence/owner:

## Network, DNS, and TLS

- [ ] Production hostname and DNS ownership are approved.
- [ ] Ingress or Gateway exposes only the web entry point; MySQL and the API are not directly public.
- [ ] TLS renewal, HSTS, secure cookies, rate limits, request limits, and DDoS controls were tested.
- [ ] Health checks and a smoke test use the real production hostname.
- Hostname, evidence, and owner:

## Reliability and observability

- [ ] Availability and latency objectives have dashboards and actionable alerts.
- [ ] Central logs, metrics, traces, audit retention, and alert routing are verified.
- [ ] On-call ownership, escalation paths, status communication, and runbooks are current.
- [ ] Load, failure, dependency outage, and rollback exercises passed.
- Evidence/owner:

## Privacy and security

- [ ] Threat modeling covers authentication, uploads, audio processing, AI, and administrative access.
- [ ] Data classification, retention, deletion, privacy notice, and incident response are approved.
- [ ] Exposure and vulnerability testing have no unresolved launch blockers.
- [ ] Production access is reviewed, time-bounded where possible, and auditable.
- Evidence/owner:

## Launch and rollback

- [ ] The exact `deploy/test` state was verified; no mutable artifact will be rebuilt.
- [ ] Database compatibility permits rollback or has an approved roll-forward plan.
- [ ] A previous healthy GitOps revision and rollback commands are recorded.
- [ ] Launch, monitoring, go/no-go, and rollback windows are staffed.
- Final decision, evidence, and Producer signature:
