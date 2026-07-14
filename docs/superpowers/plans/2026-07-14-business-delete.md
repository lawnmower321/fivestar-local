# Business Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a founder hard-delete a business (and its cascaded reviews) from the admin detail page, behind a type-the-name confirmation.

**Architecture:** Add a pure `deleteBusiness` + `countReviews` to `lib/replydesk/db.ts` (DI, unit-tested with a fake Supabase client), a self-authenticating `deleteBusinessAction` in the app shell that catches DB errors and returns them (redirecting only on success), and a `DeleteBusiness` client component rendered at the bottom of the business detail page.

**Tech Stack:** Next.js 16 (App Router, async params, server actions), TypeScript, `@supabase/supabase-js` (service-role, server-only), Vitest, Tailwind.

**Spec:** `docs/superpowers/specs/2026-07-14-business-delete-design.md`

## Global Constraints

- Hard delete only; businesses only. Individual reviews are NOT deletable. Reviews are removed by the existing `on delete cascade` FK (`supabase/migrations/0001_replydesk.sql:13`). No migration.
- `lib/replydesk/**` never imports `next/*`; external clients are injected (pure/DI), tested with fakes.
- Every server action calls `await requireSession()` as its FIRST statement (server actions are public POST endpoints; the route-group layout guards page render only).
- `redirect()` MUST be called outside any `try/catch` and its throw must not be caught (Next 16 `redirect.md` Behavior + `unstable_rethrow.md`). The action catches DB errors server-side and returns `{ error }`; only the success path reaches `redirect`.
- Secrets stay server-side; never `NEXT_PUBLIC_`, never commit `.env.local`.
- `docs/replydesk/DECISIONS.md` is append-only.
- Path-scoped `git add` only — never stage the uncommitted marketing files (`app/page.tsx`, `components/site/*`, `lib/content.ts`, `.gitignore`, `.mcp.json`).
- Tailwind color tokens in this repo: `gblue`, `gred`, `ggreen`, `gyellow` (see existing components).

---

### Task 1: DB layer — `deleteBusiness` + `countReviews`

**Files:**
- Modify: `lib/replydesk/db.ts` (append two functions after `markPosted`, line 103)
- Test: `tests/replydesk/db.test.ts` (create)

**Interfaces:**
- Consumes: `SupabaseClient` from `@supabase/supabase-js` (already imported in db.ts).
- Produces:
  - `deleteBusiness(db: SupabaseClient, id: string): Promise<void>` — deletes the `businesses` row; throws `Error(error.message)` on Supabase error.
  - `countReviews(db: SupabaseClient, businessId: string): Promise<number>` — returns the count of `reviews` rows for the business; `0` when count is null; throws on error.

- [ ] **Step 1: Write the failing tests**

Create `tests/replydesk/db.test.ts`. The fake mimics the Supabase query builder: every chain method returns the builder, and the builder is thenable, resolving to the configured `{ error, count }`. `deleteBusiness` awaits `.from(t).delete().eq(c,v)`; `countReviews` awaits `.from(t).select("*", opts).eq(c,v)`.

```ts
import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteBusiness, countReviews } from "@/lib/replydesk/db";

type Call = { method: string; args: unknown[] };

function fakeDb(result: { error?: { message: string } | null; count?: number | null }) {
  const calls: Call[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {};
  for (const m of ["from", "delete", "select", "eq"]) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => void) =>
    resolve({ error: result.error ?? null, count: result.count ?? null });
  return { db: builder as unknown as SupabaseClient, calls };
}

describe("deleteBusiness", () => {
  it("deletes the businesses row by id", async () => {
    const { db, calls } = fakeDb({ error: null });
    await deleteBusiness(db, "biz-1");
    expect(calls).toContainEqual({ method: "from", args: ["businesses"] });
    expect(calls.some((c) => c.method === "delete")).toBe(true);
    expect(calls).toContainEqual({ method: "eq", args: ["id", "biz-1"] });
  });

  it("throws the Supabase error message on failure", async () => {
    const { db } = fakeDb({ error: { message: "delete boom" } });
    await expect(deleteBusiness(db, "biz-1")).rejects.toThrow("delete boom");
  });
});

describe("countReviews", () => {
  it("returns the row count for the business", async () => {
    const { db, calls } = fakeDb({ count: 3 });
    expect(await countReviews(db, "biz-1")).toBe(3);
    expect(calls).toContainEqual({ method: "from", args: ["reviews"] });
    expect(calls).toContainEqual({ method: "eq", args: ["business_id", "biz-1"] });
  });

  it("returns 0 when the count is null", async () => {
    const { db } = fakeDb({ count: null });
    expect(await countReviews(db, "biz-1")).toBe(0);
  });

  it("throws the Supabase error message on failure", async () => {
    const { db } = fakeDb({ error: { message: "count boom" } });
    await expect(countReviews(db, "biz-1")).rejects.toThrow("count boom");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/replydesk/db.test.ts`
Expected: FAIL — `deleteBusiness`/`countReviews` are not exported from db.ts.

- [ ] **Step 3: Implement the two functions**

Append to `lib/replydesk/db.ts` after `markPosted` (currently ends line 103):

```ts
export async function deleteBusiness(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("businesses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function countReviews(db: SupabaseClient, businessId: string): Promise<number> {
  const { count, error } = await db.from("reviews")
    .select("*", { count: "exact", head: true }).eq("business_id", businessId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/replydesk/db.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/replydesk/db.ts tests/replydesk/db.test.ts
git commit -m "feat(replydesk): deleteBusiness + countReviews db helpers"
```

---

### Task 2: Delete action + danger-zone UI

**Files:**
- Modify: `app/admin/actions.ts` (add import of `deleteBusiness`; add `deleteBusinessAction`)
- Create: `components/admin/delete-business.tsx`
- Modify: `app/admin/(protected)/businesses/[id]/page.tsx` (fetch `countReviews`, render `DeleteBusiness`)

**Interfaces:**
- Consumes: `deleteBusiness`, `countReviews` (Task 1); `requireSession` (`./require-session`); `getDb`, `getBusiness`, `listReviews` (existing, db.ts); `redirect` from `next/navigation` (already imported in actions.ts).
- Produces:
  - `deleteBusinessAction(businessId: string): Promise<{ error: string } | void>` — authenticates, deletes; returns `{ error }` on DB failure, `redirect("/admin")` on success.
  - `DeleteBusiness({ businessId, businessName, reviewCount }: { businessId: string; businessName: string; reviewCount: number })` — client component.

- [ ] **Step 1: Add the server action**

In `app/admin/actions.ts`, extend the db import (line 5) to include `deleteBusiness`:

```ts
import { getDb, createBusiness, getBusiness, updateBusiness, insertReview, markPosted, recentPostedReplies, deleteBusiness } from "@/lib/replydesk/db";
```

Append this action to the end of the file (after `markPostedAction`, line 100). `redirect` is intentionally OUTSIDE the try block — a DB error is returned to the caller, the success path throws `NEXT_REDIRECT` uncaught (per Global Constraints):

```ts
export async function deleteBusinessAction(businessId: string): Promise<{ error: string } | void> {
  await requireSession();
  try {
    await deleteBusiness(getDb(), businessId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Delete failed — try again." };
  }
  redirect("/admin");
}
```

- [ ] **Step 2: Create the danger-zone component**

Create `components/admin/delete-business.tsx`. The button is disabled until the typed text exactly equals the business name (case-sensitive). On DB failure the action returns `{ error }`, shown in red; on success the action redirects, so there is no success branch to handle.

```tsx
"use client";

import { useState, useTransition } from "react";
import { deleteBusinessAction } from "@/app/admin/actions";

export function DeleteBusiness({
  businessId,
  businessName,
  reviewCount,
}: {
  businessId: string;
  businessName: string;
  reviewCount: number;
}) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const armed = confirm === businessName;

  const del = () =>
    start(async () => {
      setError(null);
      const res = await deleteBusinessAction(businessId);
      // Success redirects server-side; only a failure returns here.
      if (res?.error) setError(res.error);
    });

  return (
    <section className="rounded-2xl border border-gred/40 bg-gred/5 p-6">
      <h2 className="font-heading text-lg font-bold text-gred">Danger zone</h2>
      <p className="mt-2 text-sm text-slate-600">
        Type <span className="font-semibold text-slate-800">&ldquo;{businessName}&rdquo;</span> to
        enable deletion. This permanently removes the business and all {reviewCount} of its review
        records.
      </p>
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={businessName}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gred"
      />
      <button
        disabled={!armed || pending}
        onClick={del}
        className="mt-3 rounded-lg bg-gred px-4 py-2 text-sm font-medium text-white hover:bg-gred/90 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete this business"}
      </button>
      {error && <p className="mt-3 text-sm text-gred">{error}</p>}
    </section>
  );
}
```

- [ ] **Step 3: Render it on the detail page**

In `app/admin/(protected)/businesses/[id]/page.tsx`:

Add to the imports (after line 3):

```tsx
import { DeleteBusiness } from "@/components/admin/delete-business";
```

Extend the db import on line 1 to include `countReviews`:

```tsx
import { getDb, getBusiness, listReviews, countReviews } from "@/lib/replydesk/db";
```

After the `reviews` line (line 20), add the total count (drafts + posted — the danger-zone number is ALL review records, not just posted):

```tsx
  const reviewCount = await countReviews(db, id);
```

Add `<DeleteBusiness .../>` as the last child inside the outer `<div className="space-y-8">`, right after `<ReplyWorkspace .../>` (line 34):

```tsx
      <DeleteBusiness businessId={business.id} businessName={business.name} reviewCount={reviewCount} />
```

- [ ] **Step 4: Typecheck, lint, build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no errors (`&ldquo;`/`&rdquo;` avoid the unescaped-entities rule).

Run: `npm run build`
Expected: compiles; `/admin/businesses/[id]` present in the route list.

- [ ] **Step 5: Run the full test suite (no regressions)**

Run: `npm test`
Expected: all tests pass (49 = prior 44 + 5 new from Task 1).

- [ ] **Step 6: Commit**

```bash
git add app/admin/actions.ts components/admin/delete-business.tsx "app/admin/(protected)/businesses/[id]/page.tsx"
git commit -m "feat(replydesk): delete a business from the detail page (danger zone)"
```

- [ ] **Step 7: Manual E2E (human, needs live env + dev server)**

On the dev server (`npx next dev -p 2099`, passcode from `REPLYDESK_PASSCODE`):
1. Open a business with reviews. Confirm the Danger zone shows the correct review count and the button is disabled.
2. Type a wrong name → button stays disabled. Type the exact name → button enables.
3. Click Delete → redirected to `/admin`; the business is gone from the list.
4. (Optional) In Supabase, confirm the business row and its review rows are both gone (cascade).

---

## Documentation (fold into Task 2's commit or a trailing doc commit)

- [ ] Append to `docs/replydesk/DECISIONS.md` (append-only, at end):

```markdown
## 2026-07-14 — Business hard-delete from the detail page
Added a "Danger zone" on the business detail page: type-the-exact-name to arm,
then `deleteBusinessAction` (self-authenticating) hard-deletes the row; reviews
cascade via the existing FK, so no migration. The action catches DB errors and
RETURNS `{ error }` (shown in the card) so that `redirect("/admin")` stays
outside any try/catch, per Next 16's redirect rules. Businesses only — reviews
stay non-deletable (they are the similarity gate's audit trail). Soft delete is
deferred to the CRM phases (spec 2026-07-14-crm-evolution-design.md).
```
