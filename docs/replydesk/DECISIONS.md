# ReplyDesk Decision Log (append-only)

Format: `## YYYY-MM-DD — <decision>` then 1–3 lines of why. Never edit old entries.

## 2026-07-10 — Internal console first, multi-tenant data model
Two founders are the only users until MRR justifies self-serve. Businesses are
rows, not tenants with auth, so the upgrade path is additive.

## 2026-07-10 — Copy-paste posting until GBP API approval
Programmatic posting requires Google Business Profile API access (application
submitted separately — see GBP-API.md). Everything else works without it.

## 2026-07-10 — Admin auth guard lives in a route group, not a header check
The originally sketched `app/admin/layout.tsx` guard let the login page
render unauthenticated by reading `headers().get("x-invoke-path")`. That
header does not appear anywhere in `node_modules/next` (searched the full
package) and is undocumented in `node_modules/next/dist/docs` — the shipped
`headers.md` reference lists only standard request headers (e.g.
`user-agent`, `authorization`) with no mention of an invoke-path header, and
Next's own documented pattern for path-based checks in this version is
`usePathname()` in a Client Component (see `redirect.md`'s Client Component
example), not a magic header available to Server Components. Relying on it
risked either failing open (guard never triggers) or a redirect loop (guard
always triggers, including on `/admin/login` itself).

Instead: `login/` lives directly under `app/admin/` with no guard, and every
other admin route lives under the route group `app/admin/(protected)/`,
whose `layout.tsx` unconditionally redirects to `/admin/login` when
`isValidSession` is false. Route groups add no URL segment, so `/admin` and
`/admin/businesses/[id]` are unaffected, but only routes inside the group are
ever subject to the guard — no path string matching required, and no way for
the check to silently no-op.

## 2026-07-10 — Task 6 business list page placed under `(protected)/`
Per the route-group guard above, the business list page (brief's literal
`app/admin/page.tsx`) was created at `app/admin/(protected)/page.tsx` instead,
so the auth guard actually protects it. Server actions stayed at
`app/admin/actions.ts` (route groups don't change import paths), so
`@/app/admin/actions` still resolves for this page and for Tasks 7–8.

## 2026-07-10 — Task 7 business detail page placed under `(protected)/`
Same reasoning as Task 6: the brief's literal `app/admin/businesses/[id]/page.tsx`
was created at `app/admin/(protected)/businesses/[id]/page.tsx` so the guard
protects it. Route groups add no URL segment, so `/admin/businesses/{id}`
still resolves correctly for links from the list page and `createBusinessAction`.
