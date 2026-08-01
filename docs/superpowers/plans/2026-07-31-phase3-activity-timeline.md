# Phase 3: Activity Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every meaningful client event (reply posted, KB/voice saved, status changed, note added) lands on a per-client Timeline tab with author attribution.

**Architecture:** New `activities` table (migration 0004). App-level writers inside existing server actions (no DB triggers) call a new `lib/crm/db.ts` `insertActivity` after the primary write. A new Timeline tab renders activities newest-first with display names joined from `profiles`. Notes are activities of type `note`, composed from the tab; only notes are deletable.

**Tech Stack:** Next.js 16.2.10 (App Router), Supabase (service-role via `lib` DI), zod, vitest, Tailwind + existing shadcn/ui admin kit.

**Spec:** `docs/superpowers/specs/2026-07-31-phases-3-5-design.md` (metadata shapes, DDL, and policy decisions live there).

## Global Constraints

- `lib/**` never imports `next/*`; Supabase client injected (pure/DI).
- Every server action: `await requireUser()` first statement, zod parse immediately after.
- Migration applied via Supabase MCP `apply_migration`, then `get_advisors` (security + performance) — advisors must be clean or explained.
- `docs/replydesk/DECISIONS.md` is append-only.
- Marketing-site files (`components/site/**`, `app/(site)/**`, `lib/content.ts`, `globals.css`) never appear in these commits — path-scoped `git add` only.
- All new admin pages: `export const dynamic = "force-dynamic"`.
- Activity-writer failures propagate (no try/catch swallowing).
- Verify suite: `npm test`, `npm run lint`, `npm run build` — all clean before any commit claiming completion.
- This repo's Next.js differs from training data — read `node_modules/next/dist/docs/` before using unfamiliar APIs.

---

### Task 1: Migration 0004_activities

**Files:**
- Create: `supabase/migrations/0004_activities.sql`

**Interfaces:**
- Produces: `activities` table (columns exactly as below) that Task 2's helpers read/write.

- [ ] **Step 1: Write the migration file**

```sql
-- Phase 3: per-client activity timeline. Notes are activities of type
-- 'note' — one timeline, one table. RLS on, zero policies (service-role
-- access only, same as profiles).
create table activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  type text not null check (type in
    ('note','reply_posted','status_change','kb_updated','task_completed')),
  body text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table activities enable row level security;
create index activities_business_created_idx on activities (business_id, created_at desc);
create index activities_user_idx on activities (user_id);
```

- [ ] **Step 2: Apply via Supabase MCP**

Call `mcp__supabase__apply_migration` with `name: "0004_activities"` and the exact SQL above.
Expected: success; `mcp__supabase__list_migrations` now shows `0004_activities`.

- [ ] **Step 3: Run advisors**

Call `mcp__supabase__get_advisors` for `security` and `performance`.
Expected: no new findings about `activities` (RLS is enabled; both FKs indexed). Pre-existing unrelated findings are out of scope.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0004_activities.sql
git commit -m "feat(crm): activities table for the client timeline (0004)"
```

---

### Task 2: Activity types + db helpers

**Files:**
- Create: `lib/crm/types.ts`
- Create: `lib/crm/db.ts`
- Test: `tests/crm/db.test.ts`

**Interfaces:**
- Consumes: `activities` table from Task 1.
- Produces (used by Tasks 3–6):
  - `ACTIVITY_TYPES`, `type ActivityType`
  - `type Activity = { id; businessId; userId: string | null; type: ActivityType; body: string | null; metadata: Record<string, unknown> | null; createdAt: string }`
  - `type Profile = { id: string; displayName: string }`
  - `insertActivity(db, a: { businessId: string; userId: string | null; type: ActivityType; body?: string | null; metadata?: Record<string, unknown> | null }): Promise<void>`
  - `listActivities(db, businessId, limit = 50): Promise<Activity[]>` (newest first)
  - `deleteNoteActivity(db, id): Promise<void>` (deletes only rows with `type = 'note'`)
  - `listProfiles(db): Promise<Profile[]>`

- [ ] **Step 1: Write the failing tests**

`tests/crm/db.test.ts` — copy the `fakeDb` builder pattern from `tests/replydesk/db.test.ts` verbatim (it records `{method, args}` calls and resolves a canned result), adding `"insert"`, `"order"`, `"limit"` to the method list:

```ts
import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insertActivity, listActivities, deleteNoteActivity, listProfiles } from "@/lib/crm/db";

type Call = { method: string; args: unknown[] };

function fakeDb(result: { error?: { message: string } | null; data?: unknown }) {
  const calls: Call[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {};
  for (const m of ["from", "insert", "delete", "select", "eq", "update", "order", "limit", "single", "maybeSingle"]) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => void) =>
    resolve({ error: result.error ?? null, data: result.data ?? null });
  return { db: builder as unknown as SupabaseClient, calls };
}

describe("insertActivity", () => {
  it("inserts a snake_case row with nulls for omitted body/metadata", async () => {
    const { db, calls } = fakeDb({ error: null });
    await insertActivity(db, { businessId: "biz-1", userId: "u1", type: "reply_posted", metadata: { review_id: "r1" } });
    expect(calls).toContainEqual({ method: "from", args: ["activities"] });
    const insert = calls.find((c) => c.method === "insert");
    expect(insert?.args[0]).toEqual({
      business_id: "biz-1", user_id: "u1", type: "reply_posted",
      body: null, metadata: { review_id: "r1" },
    });
  });

  it("throws the Supabase error message on failure", async () => {
    const { db } = fakeDb({ error: { message: "insert boom" } });
    await expect(insertActivity(db, { businessId: "b", userId: null, type: "note", body: "hi" }))
      .rejects.toThrow("insert boom");
  });
});

describe("listActivities", () => {
  it("queries newest-first for the business and maps rows", async () => {
    const row = {
      id: "a1", business_id: "biz-1", user_id: "u1", type: "note",
      body: "called them", metadata: null, created_at: "2026-07-31T12:00:00Z",
    };
    const { db, calls } = fakeDb({ data: [row] });
    const out = await listActivities(db, "biz-1");
    expect(out).toEqual([{
      id: "a1", businessId: "biz-1", userId: "u1", type: "note",
      body: "called them", metadata: null, createdAt: "2026-07-31T12:00:00Z",
    }]);
    expect(calls).toContainEqual({ method: "eq", args: ["business_id", "biz-1"] });
    expect(calls).toContainEqual({ method: "order", args: ["created_at", { ascending: false }] });
    expect(calls).toContainEqual({ method: "limit", args: [50] });
  });
});

describe("deleteNoteActivity", () => {
  it("deletes by id AND type=note so non-notes can never be deleted", async () => {
    const { db, calls } = fakeDb({ error: null });
    await deleteNoteActivity(db, "a1");
    expect(calls.some((c) => c.method === "delete")).toBe(true);
    expect(calls).toContainEqual({ method: "eq", args: ["id", "a1"] });
    expect(calls).toContainEqual({ method: "eq", args: ["type", "note"] });
  });
});

describe("listProfiles", () => {
  it("maps display_name to displayName", async () => {
    const { db } = fakeDb({ data: [{ id: "u1", display_name: "Brendan" }] });
    expect(await listProfiles(db)).toEqual([{ id: "u1", displayName: "Brendan" }]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/crm/db.test.ts`
Expected: FAIL — `Cannot find module '@/lib/crm/db'` (or equivalent).

- [ ] **Step 3: Implement types and helpers**

`lib/crm/types.ts`:

```ts
// CRM satellite-table types (activities now; tasks in Phase 4). Pure TS.
export const ACTIVITY_TYPES = [
  "note", "reply_posted", "status_change", "kb_updated", "task_completed",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type Activity = {
  id: string;
  businessId: string;
  userId: string | null;
  type: ActivityType;
  body: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type Profile = { id: string; displayName: string };
```

`lib/crm/db.ts` (same style as `lib/replydesk/db.ts` — injected client, `must` helper, snake_case↔camelCase mapping):

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, ActivityType, Profile } from "./types";

function must<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("not found");
  return data;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToActivity(r: any): Activity {
  return {
    id: r.id, businessId: r.business_id, userId: r.user_id, type: r.type,
    body: r.body, metadata: r.metadata, createdAt: r.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function insertActivity(
  db: SupabaseClient,
  a: { businessId: string; userId: string | null; type: ActivityType;
       body?: string | null; metadata?: Record<string, unknown> | null },
): Promise<void> {
  const { error } = await db.from("activities").insert({
    business_id: a.businessId, user_id: a.userId, type: a.type,
    body: a.body ?? null, metadata: a.metadata ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function listActivities(
  db: SupabaseClient, businessId: string, limit = 50,
): Promise<Activity[]> {
  const { data, error } = await db.from("activities").select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false }).limit(limit);
  return must(data, error).map(rowToActivity);
}

// The type filter in the query itself makes non-note deletion impossible at
// the db layer — not merely hidden in the UI.
export async function deleteNoteActivity(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("activities").delete()
    .eq("id", id).eq("type", "note");
  if (error) throw new Error(error.message);
}

export async function listProfiles(db: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await db.from("profiles").select("*");
  return must(data, error).map((r) => ({ id: r.id, displayName: r.display_name }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/crm/db.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add lib/crm/types.ts lib/crm/db.ts tests/crm/db.test.ts
git commit -m "feat(crm): activity + profile db helpers"
```

---

### Task 3: activityLabel display helper

**Files:**
- Create: `lib/crm/timeline.ts`
- Test: `tests/crm/timeline.test.ts`

**Interfaces:**
- Consumes: `Activity` from `lib/crm/types.ts` (Task 2).
- Produces: `activityLabel(a: Activity): string` — used by the Timeline tab (Task 6) and later by the Phase 4 dashboard.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { activityLabel } from "@/lib/crm/timeline";
import type { Activity } from "@/lib/crm/types";

function act(partial: Partial<Activity>): Activity {
  return {
    id: "a1", businessId: "b1", userId: "u1", type: "note",
    body: null, metadata: null, createdAt: "2026-07-31T12:00:00Z",
    ...partial,
  };
}

describe("activityLabel", () => {
  it("note → its body", () => {
    expect(activityLabel(act({ type: "note", body: "called them" }))).toBe("called them");
  });
  it("reply_posted → fixed label", () => {
    expect(activityLabel(act({ type: "reply_posted", metadata: { review_id: "r1" } })))
      .toBe("Posted a review reply");
  });
  it("status_change → from → to", () => {
    expect(activityLabel(act({ type: "status_change", metadata: { from: "lead", to: "active" } })))
      .toBe("Status changed: lead → active");
  });
  it("kb_updated → section-aware", () => {
    expect(activityLabel(act({ type: "kb_updated", metadata: { section: "kb" } })))
      .toBe("Knowledgebase updated");
    expect(activityLabel(act({ type: "kb_updated", metadata: { section: "voice" } })))
      .toBe("Voice guide updated");
  });
  it("task_completed → quotes the task-title snapshot", () => {
    expect(activityLabel(act({ type: "task_completed", body: "Send invoice" })))
      .toBe("Completed task: “Send invoice”");
  });
  it("degrades safely on missing metadata", () => {
    expect(activityLabel(act({ type: "status_change", metadata: null })))
      .toBe("Status changed: ? → ?");
    expect(activityLabel(act({ type: "task_completed", body: null })))
      .toBe("Completed a task");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/crm/timeline.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
import type { Activity } from "./types";

// One-line display text per activity. Notes render their body; everything
// else derives from type + metadata (body is null except task_completed's
// task-title snapshot). Pure TS — no next/*.
export function activityLabel(a: Activity): string {
  switch (a.type) {
    case "note":
      return a.body ?? "";
    case "reply_posted":
      return "Posted a review reply";
    case "status_change": {
      const m = (a.metadata ?? {}) as { from?: string; to?: string };
      return `Status changed: ${m.from ?? "?"} → ${m.to ?? "?"}`;
    }
    case "kb_updated": {
      const m = (a.metadata ?? {}) as { section?: string };
      return m.section === "voice" ? "Voice guide updated" : "Knowledgebase updated";
    }
    case "task_completed":
      return a.body ? `Completed task: “${a.body}”` : "Completed a task";
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/crm/timeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/crm/timeline.ts tests/crm/timeline.test.ts
git commit -m "feat(crm): activityLabel timeline display helper"
```

---

### Task 4: Note action schemas

**Files:**
- Modify: `app/admin/schemas.ts` (append)
- Test: `tests/admin/schemas.test.ts` (append)

**Interfaces:**
- Produces: `addNoteSchema` (`{ businessId: uuid, body: trimmed non-empty string }`), `deleteNoteSchema` (`{ activityId: uuid, businessId: uuid }`) — consumed by Task 5's actions.

- [ ] **Step 1: Write the failing tests** (append to `tests/admin/schemas.test.ts`, matching its existing describe/it style — read the file first and mirror it)

```ts
describe("addNoteSchema", () => {
  it("trims the body and requires non-empty", () => {
    const out = addNoteSchema.parse({
      businessId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff", body: "  called them  ",
    });
    expect(out.body).toBe("called them");
    expect(() => addNoteSchema.parse({
      businessId: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff", body: "   ",
    })).toThrow();
  });
  it("rejects a non-uuid businessId", () => {
    expect(() => addNoteSchema.parse({ businessId: "nope", body: "x" })).toThrow();
  });
});

describe("deleteNoteSchema", () => {
  it("requires uuids for both ids", () => {
    expect(() => deleteNoteSchema.parse({ activityId: "nope", businessId: "nope" })).toThrow();
  });
});
```

Add `addNoteSchema, deleteNoteSchema` to the test file's import from `@/app/admin/schemas`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/admin/schemas.test.ts`
Expected: FAIL — named exports missing.

- [ ] **Step 3: Implement** (append to `app/admin/schemas.ts`)

```ts
export const addNoteSchema = z.object({
  businessId: z.uuid(),
  body: z.string().trim().min(1),
});
export const deleteNoteSchema = z.object({
  activityId: z.uuid(),
  businessId: z.uuid(),
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/admin/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/admin/schemas.ts tests/admin/schemas.test.ts
git commit -m "feat(crm): zod schemas for note actions"
```

---

### Task 5: Activity writers + note actions

**Files:**
- Modify: `app/admin/actions.ts`

**Interfaces:**
- Consumes: `insertActivity`, `deleteNoteActivity` (Task 2); `addNoteSchema`, `deleteNoteSchema` (Task 4); existing `requireUser()` (returns `{ id: string }`), `getDb`, `getBusiness`.
- Produces: `addNoteAction(businessId: string, body: string): Promise<void>`, `deleteNoteAction(activityId: string, businessId: string): Promise<void>` — called by Task 6's UI. Modified actions keep their existing exported signatures.

There are no unit tests for actions in this repo (established pattern — actions are thin shells; logic lives in tested lib). Verification is tsc/lint/build plus Task 6's manual check.

- [ ] **Step 1: Add the import and writers**

Add to the imports in `app/admin/actions.ts`:

```ts
import { insertActivity, deleteNoteActivity } from "@/lib/crm/db";
import { addNoteSchema, deleteNoteSchema } from "./schemas";  // append to the existing schemas import
```

Modify `markPostedAction` — capture the user, write `reply_posted`, widen the revalidate to the client subtree (timeline + replydesk tabs both change):

```ts
export async function markPostedAction(reviewId: string, businessId: string): Promise<void> {
  const user = await requireUser();
  const input = markPostedSchema.parse({ reviewId, businessId });
  const db = getDb();
  await markPosted(db, input.reviewId);
  await insertActivity(db, {
    businessId: input.businessId, userId: user.id,
    type: "reply_posted", metadata: { review_id: input.reviewId },
  });
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
}
```

Modify `saveKbAction` and `saveVoiceAction`:

```ts
export async function saveKbAction(businessId: string, kbMd: string): Promise<void> {
  const user = await requireUser();
  const input = saveKbSchema.parse({ businessId, kbMd });
  const db = getDb();
  await updateBusiness(db, input.businessId, { kbMd: input.kbMd });
  await insertActivity(db, {
    businessId: input.businessId, userId: user.id,
    type: "kb_updated", metadata: { section: "kb" },
  });
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
}

export async function saveVoiceAction(businessId: string, voiceMd: string): Promise<void> {
  const user = await requireUser();
  const input = saveVoiceSchema.parse({ businessId, voiceMd });
  const db = getDb();
  await updateBusiness(db, input.businessId, { voiceMd: input.voiceMd });
  await insertActivity(db, {
    businessId: input.businessId, userId: user.id,
    type: "kb_updated", metadata: { section: "voice" },
  });
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
}
```

Modify `updateClientDetailsAction` — fetch before, compare status, write only on change:

```ts
export async function updateClientDetailsAction(
  businessId: string,
  details: { status: string; contactName: string; contactEmail: string;
             contactPhone: string; reviewUrl: string },
): Promise<{ error: string } | void> {
  const user = await requireUser();
  const input = updateClientSchema.parse({ businessId, ...details });
  try {
    const db = getDb();
    const before = await getBusiness(db, input.businessId);
    await updateBusiness(db, input.businessId, {
      status: input.status,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      reviewUrl: input.reviewUrl,
    });
    if (before.status !== input.status) {
      await insertActivity(db, {
        businessId: input.businessId, userId: user.id,
        type: "status_change", metadata: { from: before.status, to: input.status },
      });
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Save failed — try again." };
  }
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
}
```

Append the note actions:

```ts
export async function addNoteAction(businessId: string, body: string): Promise<void> {
  const user = await requireUser();
  const input = addNoteSchema.parse({ businessId, body });
  await insertActivity(getDb(), {
    businessId: input.businessId, userId: user.id, type: "note", body: input.body,
  });
  revalidatePath(`/admin/clients/${input.businessId}/timeline`);
}

export async function deleteNoteAction(activityId: string, businessId: string): Promise<void> {
  await requireUser();
  const input = deleteNoteSchema.parse({ activityId, businessId });
  await deleteNoteActivity(getDb(), input.activityId);
  revalidatePath(`/admin/clients/${input.businessId}/timeline`);
}
```

- [ ] **Step 2: Verify compile + lint + existing tests**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean (existing tests unaffected).

- [ ] **Step 3: Commit**

```bash
git add app/admin/actions.ts
git commit -m "feat(crm): activity writers in reply/kb/status actions + note actions"
```

---

### Task 6: Timeline tab UI

**Files:**
- Create: `app/admin/(protected)/clients/[id]/timeline/page.tsx`
- Create: `components/admin/note-composer.tsx`
- Create: `components/admin/delete-note-button.tsx`
- Modify: `components/admin/client-tabs.tsx`

**Interfaces:**
- Consumes: `listActivities`, `listProfiles` (Task 2), `activityLabel` (Task 3), `addNoteAction`, `deleteNoteAction` (Task 5), existing `getDb`, `findBusiness` (the `[id]` layout already 404s missing clients — the page can trust `id`).

- [ ] **Step 1: Add the Timeline tab entry**

In `components/admin/client-tabs.tsx`, extend `TABS` (keep the comment convention — Phase 4 will insert Tasks before Timeline):

```ts
// Phase 4 inserts { label: "Tasks", segment: "/tasks" } before Timeline.
const TABS = [
  { label: "Overview", segment: "" },
  { label: "ReplyDesk", segment: "/replydesk" },
  { label: "Timeline", segment: "/timeline" },
];
```

- [ ] **Step 2: Note composer (client component)**

`components/admin/note-composer.tsx`:

```tsx
"use client";

import { useRef, useTransition } from "react";
import { addNoteAction } from "@/app/admin/actions";

export function NoteComposer({ businessId }: { businessId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      ref={formRef}
      action={(fd: FormData) => {
        const body = String(fd.get("body") ?? "").trim();
        if (!body) return;
        startTransition(async () => {
          await addNoteAction(businessId, body);
          formRef.current?.reset();
        });
      }}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Add a note…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gblue px-3 py-1.5 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Delete-note button (client component)**

`components/admin/delete-note-button.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteNoteAction } from "@/app/admin/actions";

export function DeleteNoteButton({ activityId, businessId }: { activityId: string; businessId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="Delete note"
      disabled={pending}
      onClick={() => startTransition(() => deleteNoteAction(activityId, businessId))}
      className="text-slate-300 hover:text-gred disabled:opacity-50"
    >
      <X className="size-4" />
    </button>
  );
}
```

- [ ] **Step 4: Timeline page (server component)**

`app/admin/(protected)/clients/[id]/timeline/page.tsx`:

```tsx
import { getDb } from "@/lib/replydesk/db";
import { listActivities, listProfiles } from "@/lib/crm/db";
import { activityLabel } from "@/lib/crm/timeline";
import { NoteComposer } from "@/components/admin/note-composer";
import { DeleteNoteButton } from "@/components/admin/delete-note-button";

export const dynamic = "force-dynamic";

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [activities, profiles] = await Promise.all([listActivities(db, id), listProfiles(db)]);
  const nameOf = new Map(profiles.map((p) => [p.id, p.displayName]));
  return (
    <div className="max-w-2xl space-y-4">
      <NoteComposer businessId={id} />
      {activities.length === 0 ? (
        <p className="text-sm text-slate-500">No activity yet — notes, posted replies, KB saves, and status changes will show up here.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm text-slate-800">{activityLabel(a)}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {a.userId ? (nameOf.get(a.userId) ?? "Former user") : "Former user"}
                  {" · "}
                  {new Date(a.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })}
                </p>
              </div>
              {a.type === "note" && <DeleteNoteButton activityId={a.id} businessId={id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify suite + manual check**

Run: `npm test && npm run lint && npm run build`
Expected: all clean; build lists `/admin/clients/[id]/timeline`.

Manual (dev server or deployed): open a client → Timeline tab: add a note (appears newest-first with your display name), delete it; save the KB → "Knowledgebase updated" appears; change status on Overview → "Status changed: … → …" appears; mark a reply posted → "Posted a review reply" appears.

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(protected)/clients/[id]/timeline/page.tsx" components/admin/note-composer.tsx components/admin/delete-note-button.tsx components/admin/client-tabs.tsx
git commit -m "feat(crm): Timeline tab with notes on the client record"
```

---

### Task 7: Docs sync + full verification

**Files:**
- Modify: `docs/replydesk/DECISIONS.md` (append), `app/admin/CLAUDE.md`, `components/admin/CLAUDE.md`, `lib/crm/CLAUDE.md`

- [ ] **Step 1: Append the DECISIONS entry**

```markdown
## 2026-07-31 — Phase 3: activity timeline (activities table, app-level writers)
activities (0004) is the one-table timeline: notes are type 'note'; reply
posts, KB/voice saves (kb_updated, metadata.section distinguishes), and real
status changes write from the actions themselves (no DB triggers — testable
writers, per the vision spec). Only notes are deletable, enforced by the db
helper's type='note' filter, not just the UI. body is null except note text
and task_completed's task-title snapshot; other labels derive from
type+metadata (lib/crm/timeline.activityLabel). Writer failures propagate
loudly. Timestamps render in America/New_York (user decision 2026-07-31,
spec 2026-07-31-phases-3-5-design.md).
```

- [ ] **Step 2: Update the three CLAUDE.md MAPs**

- `lib/crm/CLAUDE.md` MAP: add `types.ts` (Activity/ActivityType/Profile), `db.ts` (activity + profile helpers, injected client), `timeline.ts` (activityLabel).
- `components/admin/CLAUDE.md` MAP: add `note-composer.tsx`, `delete-note-button.tsx`; update `client-tabs.tsx` line to "Overview/ReplyDesk/Timeline".
- `app/admin/CLAUDE.md` MAP: add the timeline page line under the clients/[id] entries; note that writer-carrying actions revalidate the client subtree.

- [ ] **Step 3: Full verification**

Run: `npm test && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add docs/replydesk/DECISIONS.md app/admin/CLAUDE.md components/admin/CLAUDE.md lib/crm/CLAUDE.md
git commit -m "docs(crm): sync context maps + DECISIONS for phase 3 timeline"
```
