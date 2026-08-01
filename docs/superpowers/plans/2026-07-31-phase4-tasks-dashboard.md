# Phase 4: Tasks & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tasks can be created, assigned, completed, reopened, and deleted from a client's Tasks tab and a cross-client `/admin/tasks` view; `/admin` becomes the today-dashboard (today's + overdue tasks, recent activity) replacing the redirect.

**Architecture:** New `tasks` table (migration 0005). Pure date/bucketing logic in `lib/crm/dates.ts` + `lib/crm/tasks.ts` ("today" computed in America/New_York); db helpers extend `lib/crm/db.ts`. Completing a client-linked task writes a `task_completed` activity (Phase 3's `insertActivity`). Three surfaces share one `bucketTasks` helper and one task-row component.

**Tech Stack:** Next.js 16.2.10 (App Router), Supabase (service-role via `lib` DI), zod, vitest, Tailwind + existing shadcn/ui admin kit.

**Spec:** `docs/superpowers/specs/2026-07-31-phases-3-5-design.md`.
**Depends on:** Phase 3 shipped (`activities` table, `insertActivity`, `listProfiles`, Timeline tab).

## Global Constraints

- `lib/**` never imports `next/*`; Supabase client injected (pure/DI).
- Every server action: `await requireUser()` first statement, zod parse immediately after.
- Migration applied via Supabase MCP `apply_migration`, then `get_advisors` — clean or explained.
- `docs/replydesk/DECISIONS.md` is append-only.
- Marketing-site files never appear in these commits — path-scoped `git add` only.
- All new admin pages: `export const dynamic = "force-dynamic"`.
- "Today"/"overdue" math always goes through `todayInTimeZone(FOUNDER_TZ)` — never `new Date().toISOString().slice(0,10)`.
- Verify suite: `npm test`, `npm run lint`, `npm run build` — all clean before any completion claim.
- Read `node_modules/next/dist/docs/` before using unfamiliar Next APIs.

---

### Task 1: Migration 0005_tasks

**Files:**
- Create: `supabase/migrations/0005_tasks.sql`

**Interfaces:**
- Produces: `tasks` table consumed by Task 3's helpers.

- [ ] **Step 1: Write the migration file**

```sql
-- Phase 4: tasks & follow-ups. business_id nullable (general to-dos);
-- assignee null = "either of us". RLS on, zero policies (service-role only).
create table tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  assignee uuid references profiles(id) on delete set null,
  title text not null,
  due_date date,
  status text not null default 'open' check (status in ('open','done')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table tasks enable row level security;
create index tasks_business_idx on tasks (business_id);
create index tasks_assignee_idx on tasks (assignee);
create index tasks_created_by_idx on tasks (created_by);
create index tasks_status_due_idx on tasks (status, due_date);
```

- [ ] **Step 2: Apply via Supabase MCP**

Call `mcp__supabase__apply_migration` with `name: "0005_tasks"` and the SQL above.
Expected: success; `mcp__supabase__list_migrations` shows `0005_tasks`.

- [ ] **Step 3: Run advisors**

Call `mcp__supabase__get_advisors` (`security`, `performance`).
Expected: no new findings about `tasks`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0005_tasks.sql
git commit -m "feat(crm): tasks table (0005)"
```

---

### Task 2: Date + bucketing logic (pure)

**Files:**
- Modify: `lib/crm/types.ts` (append)
- Create: `lib/crm/dates.ts`
- Create: `lib/crm/tasks.ts`
- Test: `tests/crm/dates.test.ts`, `tests/crm/tasks.test.ts`

**Interfaces:**
- Produces (consumed by Tasks 3–6):
  - `type TaskStatus = "open" | "done"`
  - `type Task = { id; businessId: string | null; assignee: string | null; title: string; dueDate: string | null; status: TaskStatus; createdBy: string | null; createdAt: string; completedAt: string | null }`
  - `type TaskWithBusiness = Task & { businessName: string | null }`
  - `FOUNDER_TZ = "America/New_York"`, `todayInTimeZone(timeZone: string, now?: Date): string` (returns `YYYY-MM-DD`)
  - `isOverdue(dueDate: string | null, today: string): boolean`, `isDueToday(dueDate: string | null, today: string): boolean`
  - `bucketTasks<T extends Task>(tasks: T[], today: string): { overdue: T[]; today: T[]; upcoming: T[]; anytime: T[]; done: T[] }`

- [ ] **Step 1: Append the types**

Append to `lib/crm/types.ts`:

```ts
export type TaskStatus = "open" | "done";

export type Task = {
  id: string;
  businessId: string | null;
  assignee: string | null;
  title: string;
  dueDate: string | null;     // YYYY-MM-DD
  status: TaskStatus;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type TaskWithBusiness = Task & { businessName: string | null };
```

- [ ] **Step 2: Write the failing tests**

`tests/crm/dates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { FOUNDER_TZ, todayInTimeZone, isOverdue, isDueToday } from "@/lib/crm/dates";

describe("todayInTimeZone", () => {
  it("returns the ET calendar date, not the UTC one, late in the ET evening", () => {
    // 2026-08-01T01:30Z is still 2026-07-31 21:30 in New York (EDT = UTC-4)
    const lateEvening = new Date("2026-08-01T01:30:00Z");
    expect(todayInTimeZone(FOUNDER_TZ, lateEvening)).toBe("2026-07-31");
    expect(todayInTimeZone("UTC", lateEvening)).toBe("2026-08-01");
  });
  it("formats as YYYY-MM-DD", () => {
    expect(todayInTimeZone(FOUNDER_TZ, new Date("2026-07-15T12:00:00Z"))).toBe("2026-07-15");
  });
});

describe("isOverdue / isDueToday", () => {
  const today = "2026-07-31";
  it("classifies dates against today", () => {
    expect(isOverdue("2026-07-30", today)).toBe(true);
    expect(isOverdue("2026-07-31", today)).toBe(false);
    expect(isOverdue("2026-08-01", today)).toBe(false);
    expect(isDueToday("2026-07-31", today)).toBe(true);
    expect(isDueToday("2026-07-30", today)).toBe(false);
  });
  it("null due date is never overdue or due today", () => {
    expect(isOverdue(null, today)).toBe(false);
    expect(isDueToday(null, today)).toBe(false);
  });
});
```

`tests/crm/tasks.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { bucketTasks } from "@/lib/crm/tasks";
import type { Task } from "@/lib/crm/types";

function task(partial: Partial<Task>): Task {
  return {
    id: "t1", businessId: null, assignee: null, title: "x", dueDate: null,
    status: "open", createdBy: null, createdAt: "2026-07-31T12:00:00Z",
    completedAt: null, ...partial,
  };
}

describe("bucketTasks", () => {
  const today = "2026-07-31";
  it("splits open tasks into overdue/today/upcoming/anytime and done aside", () => {
    const tasks = [
      task({ id: "a", dueDate: "2026-07-29" }),
      task({ id: "b", dueDate: "2026-07-31" }),
      task({ id: "c", dueDate: "2026-08-04" }),
      task({ id: "d", dueDate: null }),
      task({ id: "e", dueDate: "2026-07-01", status: "done", completedAt: "2026-07-02T00:00:00Z" }),
    ];
    const b = bucketTasks(tasks, today);
    expect(b.overdue.map((t) => t.id)).toEqual(["a"]);
    expect(b.today.map((t) => t.id)).toEqual(["b"]);
    expect(b.upcoming.map((t) => t.id)).toEqual(["c"]);
    expect(b.anytime.map((t) => t.id)).toEqual(["d"]);
    expect(b.done.map((t) => t.id)).toEqual(["e"]);
  });
  it("sorts overdue and upcoming by due date ascending", () => {
    const b = bucketTasks([
      task({ id: "late2", dueDate: "2026-07-30" }),
      task({ id: "late1", dueDate: "2026-07-20" }),
      task({ id: "soon2", dueDate: "2026-08-09" }),
      task({ id: "soon1", dueDate: "2026-08-02" }),
    ], today);
    expect(b.overdue.map((t) => t.id)).toEqual(["late1", "late2"]);
    expect(b.upcoming.map((t) => t.id)).toEqual(["soon1", "soon2"]);
  });
  it("preserves generic element type (TaskWithBusiness passes through)", () => {
    const withBiz = { ...task({ id: "w" }), businessName: "Joe's" };
    expect(bucketTasks([withBiz], today).anytime[0].businessName).toBe("Joe's");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/crm/dates.test.ts tests/crm/tasks.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement**

`lib/crm/dates.ts`:

```ts
// Due-date math in the founders' timezone (user decision 2026-07-31, spec
// 2026-07-31-phases-3-5-design.md): "today" flips at midnight ET, not UTC.
// Pure TS — no next/*.
export const FOUNDER_TZ = "America/New_York";

// en-CA locale formats as YYYY-MM-DD, matching the DATE column format.
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

export function isOverdue(dueDate: string | null, today: string): boolean {
  return dueDate !== null && dueDate < today;
}

export function isDueToday(dueDate: string | null, today: string): boolean {
  return dueDate === today;
}
```

`lib/crm/tasks.ts`:

```ts
import type { Task } from "./types";
import { isDueToday, isOverdue } from "./dates";

export type TaskBuckets<T extends Task> = {
  overdue: T[]; today: T[]; upcoming: T[]; anytime: T[]; done: T[];
};

// One bucketing rule for all three task surfaces (client tab, /admin/tasks,
// dashboard). ISO YYYY-MM-DD strings compare correctly as strings.
export function bucketTasks<T extends Task>(tasks: T[], today: string): TaskBuckets<T> {
  const b: TaskBuckets<T> = { overdue: [], today: [], upcoming: [], anytime: [], done: [] };
  for (const t of tasks) {
    if (t.status === "done") b.done.push(t);
    else if (isOverdue(t.dueDate, today)) b.overdue.push(t);
    else if (isDueToday(t.dueDate, today)) b.today.push(t);
    else if (t.dueDate) b.upcoming.push(t);
    else b.anytime.push(t);
  }
  const byDue = (a: T, z: T) => (a.dueDate! < z.dueDate! ? -1 : a.dueDate! > z.dueDate! ? 1 : 0);
  b.overdue.sort(byDue);
  b.upcoming.sort(byDue);
  return b;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/crm/dates.test.ts tests/crm/tasks.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/crm/types.ts lib/crm/dates.ts lib/crm/tasks.ts tests/crm/dates.test.ts tests/crm/tasks.test.ts
git commit -m "feat(crm): task types, ET date math, and bucketing logic"
```

---

### Task 3: Task db helpers

**Files:**
- Modify: `lib/crm/db.ts` (append)
- Test: `tests/crm/db.test.ts` (append)

**Interfaces:**
- Consumes: `tasks` table (Task 1), `Task`/`TaskWithBusiness` types (Task 2), the file's existing `must` helper and style.
- Produces (consumed by Tasks 4–6):
  - `createTask(db, t: { businessId: string | null; assignee: string | null; title: string; dueDate: string | null; createdBy: string | null }): Promise<Task>`
  - `listTasksForBusiness(db, businessId): Promise<Task[]>` (created_at desc; bucketing happens in `bucketTasks`)
  - `listAllTasks(db): Promise<TaskWithBusiness[]>` (all tasks, join `businesses(name)`, created_at desc)
  - `completeTask(db, id): Promise<Task>` (sets status/completed_at, returns the row — callers need businessId + title for the activity)
  - `reopenTask(db, id): Promise<void>` (status open, completed_at null)
  - `deleteTask(db, id): Promise<void>`
  - `listRecentActivities(db, limit = 10): Promise<(Activity & { businessName: string })[]>` (join `businesses(name)`, newest first — dashboard)

- [ ] **Step 1: Write the failing tests** (append to `tests/crm/db.test.ts`; the fakeDb builder already covers the needed methods — add `"in"` and `"is"` to its method list if referenced)

```ts
describe("createTask", () => {
  it("inserts snake_case and maps the returned row", async () => {
    const row = {
      id: "t1", business_id: "biz-1", assignee: null, title: "Send invoice",
      due_date: "2026-08-01", status: "open", created_by: "u1",
      created_at: "2026-07-31T12:00:00Z", completed_at: null,
    };
    const { db, calls } = fakeDb({ data: row });
    const out = await createTask(db, {
      businessId: "biz-1", assignee: null, title: "Send invoice",
      dueDate: "2026-08-01", createdBy: "u1",
    });
    expect(calls.find((c) => c.method === "insert")?.args[0]).toEqual({
      business_id: "biz-1", assignee: null, title: "Send invoice",
      due_date: "2026-08-01", created_by: "u1",
    });
    expect(out).toEqual({
      id: "t1", businessId: "biz-1", assignee: null, title: "Send invoice",
      dueDate: "2026-08-01", status: "open", createdBy: "u1",
      createdAt: "2026-07-31T12:00:00Z", completedAt: null,
    });
  });
});

describe("completeTask", () => {
  it("updates status+completed_at and returns the mapped row", async () => {
    const row = {
      id: "t1", business_id: "biz-1", assignee: null, title: "Send invoice",
      due_date: null, status: "done", created_by: null,
      created_at: "2026-07-31T12:00:00Z", completed_at: "2026-07-31T13:00:00Z",
    };
    const { db, calls } = fakeDb({ data: row });
    const out = await completeTask(db, "t1");
    const update = calls.find((c) => c.method === "update");
    expect((update?.args[0] as { status: string }).status).toBe("done");
    expect((update?.args[0] as { completed_at: string }).completed_at).toBeTruthy();
    expect(calls).toContainEqual({ method: "eq", args: ["id", "t1"] });
    expect(out.businessId).toBe("biz-1");
    expect(out.title).toBe("Send invoice");
  });
});

describe("reopenTask", () => {
  it("resets status and clears completed_at", async () => {
    const { db, calls } = fakeDb({ error: null });
    await reopenTask(db, "t1");
    expect(calls.find((c) => c.method === "update")?.args[0]).toEqual({
      status: "open", completed_at: null,
    });
  });
});

describe("deleteTask", () => {
  it("deletes by id", async () => {
    const { db, calls } = fakeDb({ error: null });
    await deleteTask(db, "t1");
    expect(calls).toContainEqual({ method: "from", args: ["tasks"] });
    expect(calls.some((c) => c.method === "delete")).toBe(true);
    expect(calls).toContainEqual({ method: "eq", args: ["id", "t1"] });
  });
});

describe("listAllTasks", () => {
  it("joins the business name and maps null business to null name", async () => {
    const rows = [
      { id: "t1", business_id: "biz-1", assignee: null, title: "a", due_date: null,
        status: "open", created_by: null, created_at: "2026-07-31T12:00:00Z",
        completed_at: null, businesses: { name: "Joe's" } },
      { id: "t2", business_id: null, assignee: null, title: "b", due_date: null,
        status: "open", created_by: null, created_at: "2026-07-30T12:00:00Z",
        completed_at: null, businesses: null },
    ];
    const { db } = fakeDb({ data: rows });
    const out = await listAllTasks(db);
    expect(out[0].businessName).toBe("Joe's");
    expect(out[1].businessName).toBeNull();
  });
});

describe("listRecentActivities", () => {
  it("joins the business name onto activities, newest first", async () => {
    const rows = [{
      id: "a1", business_id: "biz-1", user_id: "u1", type: "note", body: "hi",
      metadata: null, created_at: "2026-07-31T12:00:00Z", businesses: { name: "Joe's" },
    }];
    const { db, calls } = fakeDb({ data: rows });
    const out = await listRecentActivities(db);
    expect(out[0].businessName).toBe("Joe's");
    expect(out[0].type).toBe("note");
    expect(calls).toContainEqual({ method: "order", args: ["created_at", { ascending: false }] });
    expect(calls).toContainEqual({ method: "limit", args: [10] });
  });
});
```

Extend the test file's import from `@/lib/crm/db` with the new names.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/crm/db.test.ts`
Expected: new tests FAIL (missing exports); Phase 3 tests still PASS.

- [ ] **Step 3: Implement** (append to `lib/crm/db.ts`; add `Task`, `TaskWithBusiness` to the type import)

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToTask(r: any): Task {
  return {
    id: r.id, businessId: r.business_id, assignee: r.assignee, title: r.title,
    dueDate: r.due_date, status: r.status, createdBy: r.created_by,
    createdAt: r.created_at, completedAt: r.completed_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function createTask(
  db: SupabaseClient,
  t: { businessId: string | null; assignee: string | null; title: string;
       dueDate: string | null; createdBy: string | null },
): Promise<Task> {
  const { data, error } = await db.from("tasks").insert({
    business_id: t.businessId, assignee: t.assignee, title: t.title,
    due_date: t.dueDate, created_by: t.createdBy,
  }).select("*").single();
  return rowToTask(must(data, error));
}

export async function listTasksForBusiness(db: SupabaseClient, businessId: string): Promise<Task[]> {
  const { data, error } = await db.from("tasks").select("*")
    .eq("business_id", businessId).order("created_at", { ascending: false });
  return must(data, error).map(rowToTask);
}

export async function listAllTasks(db: SupabaseClient): Promise<TaskWithBusiness[]> {
  const { data, error } = await db.from("tasks").select("*, businesses(name)")
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return must(data, error).map((r: any) => ({
    ...rowToTask(r), businessName: r.businesses?.name ?? null,
  }));
}

export async function completeTask(db: SupabaseClient, id: string): Promise<Task> {
  const { data, error } = await db.from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id).select("*").single();
  return rowToTask(must(data, error));
}

export async function reopenTask(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("tasks")
    .update({ status: "open", completed_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTask(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listRecentActivities(
  db: SupabaseClient, limit = 10,
): Promise<(Activity & { businessName: string })[]> {
  const { data, error } = await db.from("activities").select("*, businesses(name)")
    .order("created_at", { ascending: false }).limit(limit);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return must(data, error).map((r: any) => ({
    ...rowToActivity(r), businessName: r.businesses?.name ?? "",
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/crm/db.test.ts`
Expected: PASS (all, including Phase 3's).

- [ ] **Step 5: Commit**

```bash
git add lib/crm/db.ts tests/crm/db.test.ts
git commit -m "feat(crm): task db helpers + cross-client recent activities"
```

---

### Task 4: Task action schemas + actions

**Files:**
- Modify: `app/admin/schemas.ts` (append)
- Modify: `app/admin/actions.ts` (append)
- Test: `tests/admin/schemas.test.ts` (append)

**Interfaces:**
- Consumes: Task 3's db helpers; Phase 3's `insertActivity`; existing `requireUser`, `getDb`.
- Produces (consumed by Tasks 5–6):
  - `createTaskAction(input: { businessId: string; title: string; dueDate: string; assignee: string }): Promise<{ error: string } | void>` (empty strings degrade to null)
  - `setTaskStatusAction(taskId: string, businessId: string, done: boolean): Promise<void>` (`businessId` is `""` for general tasks — used only for revalidation)
  - `deleteTaskAction(taskId: string, businessId: string): Promise<void>`

- [ ] **Step 1: Write the failing schema tests** (append to `tests/admin/schemas.test.ts`)

```ts
describe("createTaskSchema", () => {
  const uuid = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";
  it("degrades empty businessId/dueDate/assignee to null", () => {
    const out = createTaskSchema.parse({ businessId: "", title: "Send invoice", dueDate: "", assignee: "" });
    expect(out).toEqual({ businessId: null, title: "Send invoice", dueDate: null, assignee: null });
  });
  it("accepts a full input", () => {
    const out = createTaskSchema.parse({ businessId: uuid, title: " x ", dueDate: "2026-08-01", assignee: uuid });
    expect(out.title).toBe("x");
    expect(out.dueDate).toBe("2026-08-01");
  });
  it("rejects a malformed date and an empty title", () => {
    expect(() => createTaskSchema.parse({ businessId: "", title: "x", dueDate: "8/1/2026", assignee: "" })).toThrow();
    expect(() => createTaskSchema.parse({ businessId: "", title: "  ", dueDate: "", assignee: "" })).toThrow();
  });
});

describe("setTaskStatusSchema", () => {
  const uuid = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";
  it("parses taskId + optional businessId + done flag", () => {
    expect(setTaskStatusSchema.parse({ taskId: uuid, businessId: "", done: true }))
      .toEqual({ taskId: uuid, businessId: null, done: true });
  });
});
```

Add `createTaskSchema, setTaskStatusSchema, deleteTaskSchema` to the imports.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/admin/schemas.test.ts`
Expected: FAIL — exports missing.

- [ ] **Step 3: Implement schemas** (append to `app/admin/schemas.ts`)

```ts
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Empty form fields degrade to null (same convention as optionalTrimmed).
const optionalUuid = z.string().trim().transform((s) => (s === "" ? null : s)).pipe(z.uuid().nullable());
const optionalDate = z.string().trim().transform((s) => (s === "" ? null : s))
  .pipe(z.string().regex(DATE_RE, "must be YYYY-MM-DD").nullable());

export const createTaskSchema = z.object({
  businessId: optionalUuid,
  title: z.string().trim().min(1),
  dueDate: optionalDate,
  assignee: optionalUuid,
});
export const setTaskStatusSchema = z.object({
  taskId: z.uuid(),
  businessId: optionalUuid,
  done: z.boolean(),
});
export const deleteTaskSchema = z.object({
  taskId: z.uuid(),
  businessId: optionalUuid,
});
```

- [ ] **Step 4: Run schema tests to verify they pass**

Run: `npx vitest run tests/admin/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement actions** (append to `app/admin/actions.ts`; extend the lib/crm/db import with `createTask, completeTask, reopenTask, deleteTask`, and the schemas import with the three new schemas)

```ts
function revalidateTaskSurfaces(businessId: string | null): void {
  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
  if (businessId) revalidatePath(`/admin/clients/${businessId}`, "layout");
}

export async function createTaskAction(input: {
  businessId: string; title: string; dueDate: string; assignee: string;
}): Promise<{ error: string } | void> {
  const user = await requireUser();
  const p = createTaskSchema.parse(input);
  try {
    await createTask(getDb(), {
      businessId: p.businessId, assignee: p.assignee, title: p.title,
      dueDate: p.dueDate, createdBy: user.id,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Create failed — try again." };
  }
  revalidateTaskSurfaces(p.businessId);
}

export async function setTaskStatusAction(taskId: string, businessId: string, done: boolean): Promise<void> {
  const user = await requireUser();
  const p = setTaskStatusSchema.parse({ taskId, businessId, done });
  const db = getDb();
  if (p.done) {
    const task = await completeTask(db, p.taskId);
    // task_completed lands on the client timeline only for client-linked
    // tasks (spec: general to-dos have no timeline). Title snapshot in body
    // so history survives task deletion.
    if (task.businessId) {
      await insertActivity(db, {
        businessId: task.businessId, userId: user.id,
        type: "task_completed", body: task.title,
      });
    }
  } else {
    await reopenTask(db, p.taskId);
  }
  revalidateTaskSurfaces(p.businessId);
}

export async function deleteTaskAction(taskId: string, businessId: string): Promise<void> {
  await requireUser();
  const p = deleteTaskSchema.parse({ taskId, businessId });
  await deleteTask(getDb(), p.taskId);
  revalidateTaskSurfaces(p.businessId);
}
```

- [ ] **Step 6: Verify compile + lint + tests**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add app/admin/schemas.ts app/admin/actions.ts tests/admin/schemas.test.ts
git commit -m "feat(crm): task actions (create/complete/reopen/delete) with timeline hook"
```

---

### Task 5: Task UI components + client Tasks tab

**Files:**
- Create: `components/admin/task-form.tsx`
- Create: `components/admin/task-item.tsx`
- Create: `app/admin/(protected)/clients/[id]/tasks/page.tsx`
- Modify: `components/admin/client-tabs.tsx`

**Interfaces:**
- Consumes: Task 4's actions; Task 2's `bucketTasks`, `todayInTimeZone`, `FOUNDER_TZ`, `isOverdue`; Phase 3's `listProfiles`; Task 3's `listTasksForBusiness`.
- Produces: `TaskForm` and `TaskItem` reused by Task 6's pages.
  - `TaskForm` props: `{ businessId?: string; profiles: Profile[]; businesses?: { id: string; name: string }[] }` — fixed-client form when `businessId` set; optional client dropdown when `businesses` provided; neither = general task.
  - `TaskItem` props: `{ task: Task; businessName?: string | null; assigneeName: string | null; overdue: boolean }`.

- [ ] **Step 1: Task form (client component)**

`components/admin/task-form.tsx`:

```tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { createTaskAction } from "@/app/admin/actions";
import type { Profile } from "@/lib/crm/types";

export function TaskForm({ businessId, profiles, businesses }: {
  businessId?: string;
  profiles: Profile[];
  businesses?: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectCls = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gblue";
  return (
    <form
      ref={formRef}
      action={(fd: FormData) => {
        startTransition(async () => {
          const result = await createTaskAction({
            businessId: businessId ?? String(fd.get("businessId") ?? ""),
            title: String(fd.get("title") ?? ""),
            dueDate: String(fd.get("dueDate") ?? ""),
            assignee: String(fd.get("assignee") ?? ""),
          });
          if (result?.error) setError(result.error);
          else { setError(null); formRef.current?.reset(); }
        });
      }}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
    >
      <input name="title" required placeholder="New task…"
        className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gblue" />
      {!businessId && businesses && (
        <select name="businessId" defaultValue="" className={selectCls}>
          <option value="">No client</option>
          {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <input name="dueDate" type="date" className={selectCls} />
      <select name="assignee" defaultValue="" className={selectCls}>
        <option value="">Either of us</option>
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
      </select>
      <button type="submit" disabled={pending}
        className="rounded-lg bg-gblue px-3 py-1.5 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
        {pending ? "Adding…" : "Add"}
      </button>
      {error && <p className="w-full text-sm text-gred">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: Task item (client component)**

`components/admin/task-item.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { setTaskStatusAction, deleteTaskAction } from "@/app/admin/actions";
import type { Task } from "@/lib/crm/types";

export function TaskItem({ task, businessName, assigneeName, overdue }: {
  task: Task;
  businessName?: string | null;
  assigneeName: string | null;
  overdue: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const done = task.status === "done";
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
      <input
        type="checkbox"
        checked={done}
        disabled={pending}
        aria-label={done ? `Reopen "${task.title}"` : `Complete "${task.title}"`}
        onChange={() => startTransition(() =>
          setTaskStatusAction(task.id, task.businessId ?? "", !done),
        )}
        className="size-4 accent-gblue"
      />
      <div className="min-w-0 flex-1">
        <p className={done ? "truncate text-sm text-slate-400 line-through" : "truncate text-sm text-slate-800"}>
          {task.title}
        </p>
        <p className="text-xs text-slate-400">
          {businessName && task.businessId && (
            <>
              <Link href={`/admin/clients/${task.businessId}`} className="hover:text-gblue hover:underline">
                {businessName}
              </Link>
              {" · "}
            </>
          )}
          {assigneeName ?? "Either of us"}
          {task.dueDate && (
            <>
              {" · "}
              <span className={overdue && !done ? "font-medium text-gred" : undefined}>
                due {task.dueDate}
              </span>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Delete "${task.title}"`}
        disabled={pending}
        onClick={() => startTransition(() => deleteTaskAction(task.id, task.businessId ?? ""))}
        className="text-slate-300 hover:text-gred disabled:opacity-50"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}
```

- [ ] **Step 3: Client Tasks tab page**

`app/admin/(protected)/clients/[id]/tasks/page.tsx`:

```tsx
import { getDb } from "@/lib/replydesk/db";
import { listTasksForBusiness, listProfiles } from "@/lib/crm/db";
import { bucketTasks } from "@/lib/crm/tasks";
import { FOUNDER_TZ, todayInTimeZone, isOverdue } from "@/lib/crm/dates";
import { TaskForm } from "@/components/admin/task-form";
import { TaskItem } from "@/components/admin/task-item";
import type { Task } from "@/lib/crm/types";

export const dynamic = "force-dynamic";

export default async function ClientTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [tasks, profiles] = await Promise.all([listTasksForBusiness(db, id), listProfiles(db)]);
  const nameOf = new Map(profiles.map((p) => [p.id, p.displayName]));
  const today = todayInTimeZone(FOUNDER_TZ);
  const b = bucketTasks(tasks, today);
  const sections: [string, Task[]][] = [
    ["Overdue", b.overdue], ["Today", b.today], ["Upcoming", b.upcoming],
    ["Anytime", b.anytime], ["Done", b.done],
  ];
  return (
    <div className="max-w-2xl space-y-5">
      <TaskForm businessId={id} profiles={profiles} />
      {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks for this client yet.</p>}
      {sections.map(([label, items]) => items.length > 0 && (
        <section key={label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</h2>
          <ul className="space-y-2">
            {items.map((t) => (
              <TaskItem key={t.id} task={t}
                assigneeName={t.assignee ? (nameOf.get(t.assignee) ?? null) : null}
                overdue={isOverdue(t.dueDate, today)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Insert the Tasks tab**

In `components/admin/client-tabs.tsx`, `TABS` becomes (vision-spec order Overview | ReplyDesk | Tasks | Timeline; drop the stale phase comment):

```ts
const TABS = [
  { label: "Overview", segment: "" },
  { label: "ReplyDesk", segment: "/replydesk" },
  { label: "Tasks", segment: "/tasks" },
  { label: "Timeline", segment: "/timeline" },
];
```

- [ ] **Step 5: Verify + commit**

Run: `npm test && npm run lint && npm run build`
Expected: clean; build lists `/admin/clients/[id]/tasks`.

```bash
git add components/admin/task-form.tsx components/admin/task-item.tsx "app/admin/(protected)/clients/[id]/tasks/page.tsx" components/admin/client-tabs.tsx
git commit -m "feat(crm): Tasks tab on the client record"
```

---

### Task 6: /admin/tasks workflow view + dashboard + sidebar

**Files:**
- Create: `app/admin/(protected)/tasks/page.tsx`
- Modify: `app/admin/(protected)/page.tsx` (replace the redirect)
- Modify: `components/admin/admin-sidebar.tsx`

**Interfaces:**
- Consumes: `listAllTasks`, `listRecentActivities`, `listProfiles` (lib/crm/db), `listBusinesses` (lib/replydesk/db), `bucketTasks`, date helpers, `activityLabel`, `TaskForm`, `TaskItem`.

- [ ] **Step 1: Workflow view**

`app/admin/(protected)/tasks/page.tsx`:

```tsx
import { getDb, listBusinesses } from "@/lib/replydesk/db";
import { listAllTasks, listProfiles } from "@/lib/crm/db";
import { bucketTasks } from "@/lib/crm/tasks";
import { FOUNDER_TZ, todayInTimeZone, isOverdue } from "@/lib/crm/dates";
import { TaskForm } from "@/components/admin/task-form";
import { TaskItem } from "@/components/admin/task-item";
import type { TaskWithBusiness } from "@/lib/crm/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const db = getDb();
  const [tasks, profiles, businesses] = await Promise.all([
    listAllTasks(db), listProfiles(db), listBusinesses(db),
  ]);
  const nameOf = new Map(profiles.map((p) => [p.id, p.displayName]));
  const today = todayInTimeZone(FOUNDER_TZ);
  const b = bucketTasks(tasks, today);
  const sections: [string, TaskWithBusiness[]][] = [
    ["Overdue", b.overdue], ["Today", b.today], ["Upcoming", b.upcoming],
    ["Anytime", b.anytime], ["Done", b.done],
  ];
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Tasks</h1>
      <TaskForm profiles={profiles} businesses={businesses.map((x) => ({ id: x.id, name: x.name }))} />
      {tasks.length === 0 && <p className="text-sm text-slate-500">Nothing to do — add the first task above.</p>}
      {sections.map(([label, items]) => items.length > 0 && (
        <section key={label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</h2>
          <ul className="space-y-2">
            {items.map((t) => (
              <TaskItem key={t.id} task={t} businessName={t.businessName}
                assigneeName={t.assignee ? (nameOf.get(t.assignee) ?? null) : null}
                overdue={isOverdue(t.dueDate, today)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Dashboard replaces the redirect**

`app/admin/(protected)/page.tsx` (full replacement):

```tsx
import Link from "next/link";
import { getDb } from "@/lib/replydesk/db";
import { listAllTasks, listProfiles, listRecentActivities } from "@/lib/crm/db";
import { bucketTasks } from "@/lib/crm/tasks";
import { FOUNDER_TZ, todayInTimeZone, isOverdue } from "@/lib/crm/dates";
import { activityLabel } from "@/lib/crm/timeline";
import { TaskItem } from "@/components/admin/task-item";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const db = getDb();
  const [tasks, profiles, recent] = await Promise.all([
    listAllTasks(db), listProfiles(db), listRecentActivities(db, 10),
  ]);
  const nameOf = new Map(profiles.map((p) => [p.id, p.displayName]));
  const today = todayInTimeZone(FOUNDER_TZ);
  const b = bucketTasks(tasks, today);
  const due = [...b.overdue, ...b.today];
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Today</h1>
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Due today &amp; overdue
          </h2>
          <Link href="/admin/tasks" className="text-sm text-gblue hover:underline">All tasks →</Link>
        </div>
        {due.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing due — check <Link href="/admin/tasks" className="text-gblue hover:underline">the full list</Link> for upcoming and anytime tasks.</p>
        ) : (
          <ul className="space-y-2">
            {due.map((t) => (
              <TaskItem key={t.id} task={t} businessName={t.businessName}
                assigneeName={t.assignee ? (nameOf.get(t.assignee) ?? null) : null}
                overdue={isOverdue(t.dueDate, today)} />
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <p className="text-sm text-slate-800">{activityLabel(a)}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  <Link href={`/admin/clients/${a.businessId}/timeline`} className="hover:text-gblue hover:underline">
                    {a.businessName}
                  </Link>
                  {" · "}
                  {a.userId ? (nameOf.get(a.userId) ?? "Former user") : "Former user"}
                  {" · "}
                  {new Date(a.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: FOUNDER_TZ })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Sidebar entries**

In `components/admin/admin-sidebar.tsx`, add `LayoutDashboard` and `ListTodo` to the lucide import and add two `SidebarMenuItem` blocks around the existing Clients one — Dashboard first (exact match so it isn't active on every /admin/* page), then Clients, then Tasks:

```tsx
<SidebarMenuItem>
  <SidebarMenuButton isActive={pathname === "/admin"} render={<Link href="/admin" />}>
    <LayoutDashboard />
    <span>Dashboard</span>
  </SidebarMenuButton>
</SidebarMenuItem>
{/* existing Clients item stays as-is */}
<SidebarMenuItem>
  <SidebarMenuButton isActive={pathname.startsWith("/admin/tasks")} render={<Link href="/admin/tasks" />}>
    <ListTodo />
    <span>Tasks</span>
  </SidebarMenuButton>
</SidebarMenuItem>
```

- [ ] **Step 4: Verify + manual check**

Run: `npm test && npm run lint && npm run build`
Expected: clean; build lists `/admin` (page, not redirect) and `/admin/tasks`.

Manual: create a general task and a client task from `/admin/tasks` (client dropdown works); overdue task shows red date; complete a client task → it appears "Completed task: …" on that client's Timeline and in dashboard recent activity; reopen it → timeline entry remains; delete a task; dashboard shows only overdue + today.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(protected)/tasks/page.tsx" "app/admin/(protected)/page.tsx" components/admin/admin-sidebar.tsx
git commit -m "feat(crm): /admin/tasks workflow view + today-dashboard"
```

---

### Task 7: Docs sync + full verification

**Files:**
- Modify: `docs/replydesk/DECISIONS.md` (append), `app/admin/CLAUDE.md`, `components/admin/CLAUDE.md`, `lib/crm/CLAUDE.md`

- [ ] **Step 1: Append the DECISIONS entry**

```markdown
## 2026-07-31 — Phase 4: tasks & today-dashboard
tasks (0005): business_id nullable (general to-dos), assignee null = "either
of us". Tasks are hard-deletable (user decision 2026-07-31) — a mis-created
task must not force a bogus task_completed timeline entry. Completing a
client-linked task writes task_completed (title snapshot in body); reopening
leaves that entry (history is fact) and writes nothing. Due-date math runs in
America/New_York via lib/crm/dates (todayInTimeZone); dashboard = today +
overdue only; undated tasks live in /admin/tasks' Anytime section. /admin is
now the today-dashboard, replacing the Phase-2 redirect.
```

- [ ] **Step 2: Update the three CLAUDE.md MAPs**

- `lib/crm/CLAUDE.md`: add `dates.ts` (FOUNDER_TZ, todayInTimeZone, isOverdue/isDueToday), `tasks.ts` (bucketTasks), and the task helpers + listRecentActivities in the `db.ts` line.
- `components/admin/CLAUDE.md`: add `task-form.tsx`, `task-item.tsx`; update `admin-sidebar.tsx` (Dashboard/Clients/Tasks) and `client-tabs.tsx` (four tabs) lines.
- `app/admin/CLAUDE.md`: replace the interim-redirect line with the dashboard description; add the tasks pages.

- [ ] **Step 3: Full verification**

Run: `npm test && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add docs/replydesk/DECISIONS.md app/admin/CLAUDE.md components/admin/CLAUDE.md lib/crm/CLAUDE.md
git commit -m "docs(crm): sync context maps + DECISIONS for phase 4 tasks"
```
