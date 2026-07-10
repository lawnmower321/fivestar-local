# ReplyDesk Decision Log (append-only)

Format: `## YYYY-MM-DD — <decision>` then 1–3 lines of why. Never edit old entries.

## 2026-07-10 — Internal console first, multi-tenant data model
Two founders are the only users until MRR justifies self-serve. Businesses are
rows, not tenants with auth, so the upgrade path is additive.

## 2026-07-10 — Copy-paste posting until GBP API approval
Programmatic posting requires Google Business Profile API access (application
submitted separately — see GBP-API.md). Everything else works without it.
