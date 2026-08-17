# TemuClient V1 Controlled Launch Checklist

All items require an owner, timestamp, and evidence link before production go-live.

## Security and privacy

- [ ] Production environment validation passes with no example secret.
- [ ] HTTPS, DNS, HSTS at edge, CSP, frame, MIME, referrer, and permissions headers verified.
- [ ] Admin accounts use unique credentials and operational access review is complete.
- [ ] Seed/demo accounts are removed or disabled.
- [ ] Session revocation and password-reset drill passed.
- [ ] CSRF origin, auth rate limits, AI limits, RBAC, tenant isolation, and suspension tests passed.
- [ ] Provider cannot access Buyer email, phone, decision-maker identity, hidden organization identity, or private attachments before accepted Introduction.
- [ ] Logs/error tracking contain no secrets, tokens, private prompts, message bodies, or storage keys.

## Data and infrastructure

- [ ] Production migration reviewed and `prisma migrate status` is current.
- [ ] Point-in-time PostgreSQL backups enabled and restore drill passed.
- [ ] S3 bucket is private; signing, MIME, size, CORS, versioning, and cleanup policies verified.
- [ ] Redis is private, authenticated/TLS where supported, and outage behavior tested.
- [ ] CDN/origin rules, capacity, connection pooling, and alerts configured.

## Providers and operations

- [ ] Transactional email domain/SPF/DKIM/DMARC and templates verified.
- [ ] Billing mode visibly confirmed: sandbox or live; webhook signature/idempotency passed.
- [ ] Analytics events and Qualified Introductions per Month validated.
- [ ] Error tracking, structured logs, request IDs, health probes, and alert routing verified.
- [ ] AI provider mode, rate limits, and outage fallback verified.
- [ ] On-call, incident channel, escalation, privacy contact, and rollback owner assigned.

## Release and E2E

- [ ] CI install/lint/typecheck/unit/integration/build is green.
- [ ] Staging uses the production artifact and production-equivalent services.
- [ ] Buyer: register → company → requirement → publish → matches → accept → message → meeting passed.
- [ ] Provider: register → capability → match → request → message → meeting → deal → proposal → won/lost passed.
- [ ] Admin: verify company → verify requirement → inspect audit passed.
- [ ] Liveness/readiness and rollback drill passed.
- [ ] Final launch approval recorded; 30-minute post-deploy observation assigned.
