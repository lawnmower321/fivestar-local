# Phase 2 — CRM Shell: Design

**Date:** 2026-07-15
**Status:** Approved (user, 2026-07-15)
**Parent:** docs/superpowers/specs/2026-07-14-crm-evolution-design.md (rev 2) — Phase 2
**Branch:** crm-phase-2

## Problem

The `/admin` console is a ReplyDesk tool with a flat business list. Phase 2
turns it into the CRM shell the roadmap needs: client records with status
and contact details, sidebar navigation, and a tabbed client page whose
ReplyDesk tab is the existing KB builder + reply workspace, relocated —
not rewritten. Phases 3–5 add tabs and pages to this shell without
restructuring it.

## Decisions (user-approved, 2026-07-15)

| Decision | Choice |
|---|---|
| Client list | shadcn table (Name, Status badge, Contact) + status filter chips (All · Lead · Active · Paused · Churned). No search/sort — add later if needed. |
| Editing UX | "Add client" stays minimal (name + optional review link; status defaults to Lead). Status, contact fields, and review link are edited on the client's Overview tab. |
| Tab architecture | **Nested routes**: `clients/[id]/layout.tsx` renders the header + tab links; each tab is its own page fetching only its own data. Phases 3–4 add `timeline/` and `tasks/` folders without editing existing files. |
| Sidebar (Phase 2) | Clients entry + Log out (moves from the top header). Future entries appear when their phases ship — no dead links. |
| Danger zone | Bottom of Overview. Leads keep the type-the-name hard delete; non-leads see "set status to Churned instead" guidance. Guard enforced server-side. |

## Data model — migration `0003_client_fields.sql`

```sql
alter table businesses
  add column if not exists status text not null default 'lead'
    check (status in ('lead','active','paused','churned')),
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
```

Existing rows become leads. Applied via Supabase MCP `apply_migration`
(migration history tracked from 0002 on); run MCP `get_advisors` after —
expected: no new findings (columns only, RLS state unchanged).

## Components

### 1. `lib/crm/status.ts` — pure status domain (new module + tests)

```ts
export const STATUSES = ["lead", "active", "paused", "churned"] as const;
export type ClientStatus = (typeof STATUSES)[number];
export function isClientStatus(v: string): v is ClientStatus;
export function canDeleteBusiness(status: ClientStatus): boolean; // true only for "lead"
```

Single source for the zod enum, status badges, filter chips, the list-page
`?status=` validation, and the delete guard. Pure TS (no `next/*`), first
module in the `lib/crm/` tree the parent spec calls for.

### 2. `lib/replydesk/db.ts` + `types.ts` — additive extension

- `Business` gains `status: ClientStatus`, `contactName: string | null`,
  `contactEmail: string | null`, `contactPhone: string | null`
  (`types.ts` imports `ClientStatus` from `lib/crm/status` — both pure,
  no cycle).
- `rowToBusiness` maps the four new snake_case columns. All queries use
  `select("*")`, so no query text changes.
- `updateBusiness` patch type gains the four fields, mapped conditionally
  like the existing ones (`contactName` → `contact_name`, …).
- Tests: extend the db suite for the new patch-field mapping and mapper
  output.

### 3. Schemas — `app/admin/schemas.ts`

New `updateClientSchema`: `businessId` uuid; `status` from
`z.enum(STATUSES)`; `contactName` / `contactPhone` trimmed strings where
empty → null; `contactEmail` empty → null, must be a valid email
(`z.email()`) when present; `reviewUrl` same rule as `createBusinessSchema`
(non-http(s) → null). Accept + reject tests per field rule.

### 4. Actions — `app/admin/actions.ts`

- **New** `updateClientDetailsAction(businessId, details): Promise<{ error: string } | void>`
  — `requireUser()` → `updateClientSchema.parse` → `updateBusiness` (in
  try/catch returning `{error}` on DB failure) →
  `revalidatePath(\`/admin/clients/${id}\`, "layout")` (header badge +
  Overview both refresh). Called with plain args from a client component
  (kb-builder pattern), not FormData.
- **Modified** `deleteBusinessAction`: after parse, inside the try:
  `getBusiness` (vanished id → `{error}`), then
  `if (!canDeleteBusiness(business.status)) return { error: "Only leads can be deleted — set the status to Churned instead." }`,
  then delete. `redirect("/admin/clients")` stays outside the try.
- **Modified** `createBusinessAction`: redirect to `/admin/clients/${b.id}`.
- **Modified** revalidate targets: `saveKbAction`, `saveVoiceAction`,
  `generateReplyAction`, `markPostedAction` now revalidate
  `/admin/clients/${businessId}/replydesk`.
- Every action keeps the Phase 1 contract: `requireUser()` first, zod
  parse second, `redirect` outside try/catch.

### 5. Routes

```
app/admin/(protected)/
  layout.tsx                       guard (unchanged) + sidebar shell
  page.tsx                         redirect("/admin/clients")  ← Phase 4 replaces with dashboard
  clients/page.tsx                 list: filter chips, table, add-client form
  clients/[id]/layout.tsx          client header (name, status badge, review link) + tab links
  clients/[id]/page.tsx            Overview: details form + danger zone / churned guidance
  clients/[id]/replydesk/page.tsx  KbBuilder + ReplyWorkspace (relocated as-is); maxDuration = 60 moves here
  businesses/[id]/page.tsx         DELETED
```

- `next.config.ts` gains one entry:
  `redirects() → [{ source: "/admin/businesses/:id", destination: "/admin/clients/:id", permanent: false }]`
  (307 while the tree is still evolving).
- Pages follow the existing `force-dynamic` pattern; `maxDuration = 60`
  lives only on the replydesk tab page (KB builds).
- Login still lands on `/admin`, which hops to `/admin/clients` — accepted
  extra redirect until Phase 4 ships the dashboard.
- List filtering is server-side: chips are plain `<Link href="?status=…">`;
  the page validates the param with `isClientStatus` (garbage → All).
- Unknown client id: `getBusiness` throws → error page (existing behavior).

### 6. UI components

- `components/admin/admin-sidebar.tsx` — shadcn Sidebar: brand link (to
  `/admin`), Clients menu item (lucide `Users`), Log out form
  (`logoutAction`) in the footer. The old top-header nav in
  `(protected)/layout.tsx` is replaced by the sidebar + a content inset.
- `components/admin/client-tabs.tsx` — small client component
  (`usePathname`) rendering Overview / ReplyDesk tab links with active
  styling. Hand-styled in the existing design language (like kb-builder's
  internal tabs) — no shadcn Tabs dependency for link-tabs.
- `components/admin/client-details-form.tsx` — client component: status
  select, contact name/email/phone inputs, review link input, Save button;
  `useTransition` + inline status message, errors from the action rendered
  inline (kb-builder pattern).
- Client list table: shadcn Table + Badge, rows link to the client record.
  Contact column shows `contactName · contactEmail` (whichever are present,
  ·-joined; both absent → "—"). Status badge classes: lead
  `bg-slate-100 text-slate-600`, active `bg-ggreen/10 text-ggreen`, paused
  `bg-gyellow/15 text-yellow-700`, churned `bg-slate-100 text-slate-400`.
- Existing `delete-business.tsx` is reused unchanged; the Overview page
  conditionally renders it (lead) or a static guidance card (non-lead).

### 7. shadcn/ui adoption (admin surface only)

Infrastructure already exists: `components.json` (style `base-nova`,
Base UI), `shadcn@4.13` CLI in deps, full CSS-variable theme (incl.
sidebar tokens) already in `globals.css`, and `components/ui/button.tsx` +
`accordion.tsx` already present and **imported by the marketing site**.

- Add NEW components only: `npx shadcn add sidebar table badge select
  input label` (sidebar pulls its own deps — sheet, tooltip, skeleton,
  separator, use-mobile hook — all new files).
- **Hard rule:** never overwrite `components/ui/button.tsx` or
  `components/ui/accordion.tsx`. If the CLI prompts to overwrite existing
  files, decline; new components may import the existing button as-is.
- **Registry risk:** the `base-nova` registry is newer than the classic
  radix one; component availability (esp. sidebar) must be VERIFIED as the
  plan's first UI step. Fallback if a component is missing: hand-roll the
  sidebar/table in the existing admin design language (border-slate-200,
  rounded-2xl, gblue accents) — the admin already does this well. The
  fallback changes zero interfaces; only the two shell files' internals.
- `globals.css` is expected to need NO changes (theme complete). If the
  CLI insists on editing it, that diff must be reviewed line-by-line and
  kept minimal — it is a shared file with the marketing site.

## Data flow

1. `/admin/clients?status=active` → layout guard → page validates param →
   `listBusinesses` → server-side filter → table.
2. Overview save → `updateClientDetailsAction` (requireUser → parse →
   update → revalidate layout scope) → header badge + form reflect new
   values.
3. Delete on a lead → confirm-by-name → action guard passes → delete →
   redirect `/admin/clients`. Delete attempt on a non-lead (stale UI or
   direct POST) → `{error}` rendered by the danger zone.
4. ReplyDesk tab → identical flow to today's `businesses/[id]` page, at
   the new path.

## Error handling

- Details form: zod throw or `{error}` return rendered inline; no redirect.
- Delete guard: UI hides the button for non-leads AND the action refuses
  server-side (same self-authenticating philosophy as Phase 1).
- Migration failure surfaces via MCP; advisors run after.
- Bad `?status=` values degrade to the unfiltered list.

## Testing

- Unit (vitest, no network): `lib/crm/status.ts` (STATUSES, isClientStatus,
  canDeleteBusiness); `updateClientSchema` accept/reject per field;
  db mapper + updateBusiness patch mapping for the four new fields.
- Existing suite stays green (additive mapper changes don't break
  exact-match assertions — verified none exist on Business shape).
- `tsc`, lint, build green; build route list shows `/admin/clients`,
  `/admin/clients/[id]`, `/admin/clients/[id]/replydesk`.
- Manual E2E (human): sidebar nav; add client; filter chips; edit
  status/contact/review-link on Overview; non-lead delete blocked (UI
  guidance + action error on stale form); lead delete works; full
  generate→copy→posted flow on the relocated ReplyDesk tab;
  `/admin/businesses/<id>` redirects to `/admin/clients/<id>`; `/admin`
  lands on the client list.

## Docs

- `app/admin/CLAUDE.md` MAP: new route tree, sidebar, tabs.
- `components/admin/CLAUDE.md`: new components.
- `lib/replydesk/CLAUDE.md` + new `lib/crm/` noted appropriately.
- `docs/replydesk/SPEC.md`: fix the stale "one shared passcode" access
  line (Phase 1 follow-up folded in here). `docs/replydesk/HANDOFF.md`
  stays untracked/uncommitted as it is today.
- `docs/replydesk/DECISIONS.md`: append the Phase 2 entry (append-only).

## Out of scope (deliberate)

- Activities/timeline (Phase 3), tasks (Phase 4), `/admin/replydesk`
  dashboard (Phase 5), `/admin` dashboard content (Phase 4).
- Search/sort on the client list; per-client scoping/authorization.
- Dark mode for the admin; soft-delete beyond `churned`.

## Constraints carried forward

- `lib/**` never imports `next/*`; clients injected (pure/DI).
- Every server action: `requireUser()` first, zod parse second.
- `redirect()` outside try/catch, always.
- Secrets server-side only; never `NEXT_PUBLIC_`; never commit `.env.local`.
- `docs/replydesk/DECISIONS.md` append-only.
- Marketing-site files stay out of commits (path-scoped `git add` only) —
  and for this phase specifically: `components/ui/button.tsx`,
  `components/ui/accordion.tsx`, and `app/globals.css` are marketing-shared;
  any change to them requires explicit justification in the task report.
- New/changed tables: RLS on, check-constrained enums; advisors after
  every migration.
