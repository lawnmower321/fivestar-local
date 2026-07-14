# Business Delete — Design

**Date:** 2026-07-14
**Status:** Approved (user, 2026-07-14)
**Scope:** ReplyDesk admin — CRM roadmap Phase 0 (see 2026-07-14-crm-evolution-design.md)

## Problem

There is no way to remove a business from the admin UI. Test records pile up
during development and can only be cleaned out by running SQL directly
against Supabase. The two founders need a self-serve delete.

## Decisions (user-approved)

- **Hard delete.** The row is permanently removed. Soft delete / archival is
  deferred to the CRM phases, where client history starts to matter; today
  every record is test data.
- **Businesses only.** Individual review rows are NOT deletable — they are
  the audit trail the similarity gate reads. Deleting a business removes its
  reviews via the existing `on delete cascade` FK in
  `supabase/migrations/0001_replydesk.sql`. No migration is needed.

## Design

Three small units, following the existing pure-lib / thin-shell split:

### 1. `deleteBusiness` — `lib/replydesk/db.ts`

```ts
export async function deleteBusiness(db: SupabaseClient, id: string): Promise<void>
```

Deletes the `businesses` row by id. Throws on Supabase error (same error
style as the other db helpers). Pure/DI: no `next/*` imports, tested with
the existing fake client pattern in `tests/replydesk/`.

### 2. `deleteBusinessAction` — `app/admin/actions.ts`

```ts
export async function deleteBusinessAction(businessId: string): Promise<void>
```

- `await requireSession()` as the FIRST statement (same as all 8 existing
  actions — server actions are public POST endpoints).
- Calls `deleteBusiness`, then `redirect("/admin")`.
- No return value on success (the redirect throws); Supabase errors
  propagate to the client component, which shows them like the other admin
  error paths.

### 3. Danger-zone UI — business detail page

A client component (`components/admin/delete-business.tsx`) rendered at the
bottom of `app/admin/(protected)/businesses/[id]/page.tsx`:

- Card titled "Danger zone" containing a text input and a "Delete this
  business" button.
- The button is **disabled until the typed text exactly matches the
  business name** (case-sensitive). Hard deletes don't get a one-click
  confirm.
- Helper text: `Type "<business name>" to enable deletion. This permanently
  removes the business and all <N> of its review records.`
- On click: calls `deleteBusinessAction(businessId)`; pending state disables
  the button; errors render in the card (red text), consistent with the
  reply-workspace error handling.

## Error handling

- Unauthenticated action call → `requireSession()` redirect (existing
  behavior).
- Supabase delete failure → error message rendered in the danger-zone card;
  nothing is deleted (single-statement delete, no partial state).
- Business already deleted (double-click / two tabs) → Supabase delete of a
  missing row is a no-op success; the redirect to `/admin` is still correct.

## Testing

- `deleteBusiness`: unit tests with the fake Supabase client — success path
  and error propagation.
- Gate check: `deleteBusinessAction` begins with `requireSession()`
  (covered by the same pattern-audit the auth fix pass established).
- UI: button-disabled-until-name-matches is component logic; verified by
  manual E2E on the dev server (consistent with how the other admin UI was
  verified — no component test framework is set up, and adding one is out
  of scope).

## Out of scope

- Deleting individual reviews.
- Soft delete / restore.
- Bulk delete from the list page.
