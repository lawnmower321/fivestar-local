# Phase 2 — CRM Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the flat `/admin` business list into a CRM shell: client records with status + contact fields, a shadcn sidebar, a filterable client list, and a tabbed client record whose ReplyDesk tab is the existing KB builder + reply workspace relocated.

**Architecture:** Additive migration on `businesses` (status/contact columns) + a new pure `lib/crm/` domain module. Nested routes under `app/admin/(protected)/clients/` — a shared `[id]/layout.tsx` renders the client header + tab links; each tab is its own page fetching only its own data. shadcn/ui (base-nova registry) is already wired; this phase copies in sidebar/table/badge only.

**Tech Stack:** Next.js 16 (App Router, Turbopack), Supabase (service-role data client via `lib/replydesk/db.ts`), zod v4, shadcn/ui base-nova (Base UI), Tailwind v4, vitest.

**Spec:** docs/superpowers/specs/2026-07-15-phase2-crm-shell-design.md

## Global Constraints

- `lib/**` never imports `next/*`; clients injected (pure/DI).
- Every server action: `await requireUser()` first statement, zod parse second, before any DB/AI call.
- `redirect()` outside try/catch, always (Next 16 redirect throws NEXT_REDIRECT).
- Session validation is `getClaims()` — never `getSession()` — in server code.
- Secrets server-side only; never `NEXT_PUBLIC_`; never commit `.env.local`.
- `docs/replydesk/DECISIONS.md` is append-only.
- Marketing-site files stay out of commits — path-scoped `git add` only, never `git add -A`/`.`. For THIS phase additionally: `components/ui/button.tsx`, `components/ui/accordion.tsx`, and `app/globals.css` are marketing-shared — they must not be modified; never pass `--overwrite` to the shadcn CLI.
- Status values are exactly `lead | active | paused | churned` (default `lead`) — single source `lib/crm/status.ts`; DB check constraint, zod enum, badges, and the delete guard all derive from it.
- Delete guard copy, verbatim: `Only leads can be deleted — set the status to Churned instead.`
- Status badge classes, verbatim: lead `bg-slate-100 text-slate-600`, active `bg-ggreen/10 text-ggreen`, paused `bg-gyellow/15 text-yellow-700`, churned `bg-slate-100 text-slate-400`.
- Redirect entry is non-permanent (307): `/admin/businesses/:id` → `/admin/clients/:id`.
- Migrations applied via Supabase MCP `apply_migration`; run MCP `get_advisors` (security) after.
- Test suite: 75 passing today → **93 expected after Task 3** (Task 1 +10, Task 2 +3, Task 3 +5); no test changes in Tasks 4-8.

---

### Task 1: Migration 0003 + pure status domain

**Files:**
- Create: `supabase/migrations/0003_client_fields.sql`
- Create: `lib/crm/status.ts`
- Test: `tests/crm/status.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `STATUSES: readonly ["lead","active","paused","churned"]`, `type ClientStatus = "lead"|"active"|"paused"|"churned"`, `isClientStatus(v: string): v is ClientStatus`, `canDeleteBusiness(status: ClientStatus): boolean` — all from `@/lib/crm/status`. Later tasks import these exact names.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/0003_client_fields.sql`:

```sql
-- Phase 2: businesses rows are client records — status + contact details.
alter table businesses
  add column if not exists status text not null default 'lead'
    check (status in ('lead','active','paused','churned')),
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
```

- [ ] **Step 2: Apply to the remote project (CONTROLLER step — needs Supabase MCP)**

Apply via MCP `apply_migration` with name `client_fields` and the SQL above. Then MCP `get_advisors` (security) — expected: no NEW findings (columns only; the pre-existing `rls_enabled_no_policy` INFOs and the `rls_auto_enable` WARNs are known and not from this migration). Then verify via MCP `execute_sql`: `select status, contact_name from businesses limit 1;` — expected: existing rows show `status = 'lead'`, `contact_name = null`.

- [ ] **Step 3: Write the failing tests**

Create `tests/crm/status.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { STATUSES, isClientStatus, canDeleteBusiness } from "@/lib/crm/status";

describe("STATUSES", () => {
  it("lists the four client statuses in order", () => {
    expect(STATUSES).toEqual(["lead", "active", "paused", "churned"]);
  });
});

describe("isClientStatus", () => {
  it.each(STATUSES)("accepts %s", (s) => {
    expect(isClientStatus(s)).toBe(true);
  });
  it("rejects unknown values", () => {
    expect(isClientStatus("prospect")).toBe(false);
    expect(isClientStatus("")).toBe(false);
    expect(isClientStatus("Lead")).toBe(false);
  });
});

describe("canDeleteBusiness", () => {
  it("allows deleting a lead", () => {
    expect(canDeleteBusiness("lead")).toBe(true);
  });
  it.each(["active", "paused", "churned"] as const)("refuses %s", (s) => {
    expect(canDeleteBusiness(s)).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run tests/crm/status.test.ts`
Expected: FAIL — `Cannot find package '@/lib/crm/status'`.

- [ ] **Step 5: Write the implementation**

Create `lib/crm/status.ts`:

```ts
// CRM client-status domain: single source for the status values used by the
// DB check constraint (migration 0003), the zod schema, badges, filter
// chips, and the delete guard. Pure TS — no next/*, no clients.
export const STATUSES = ["lead", "active", "paused", "churned"] as const;
export type ClientStatus = (typeof STATUSES)[number];

export function isClientStatus(v: string): v is ClientStatus {
  return (STATUSES as readonly string[]).includes(v);
}

// Hard delete is allowed only while a record is still a lead; anything
// further along is set to "churned" instead (record + history preserved).
export function canDeleteBusiness(status: ClientStatus): boolean {
  return status === "lead";
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/crm/status.test.ts`
Expected: PASS — 10 tests.

- [ ] **Step 7: Typecheck + full suite**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npm test` — expected: 85 passing (75 + 10).

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/0003_client_fields.sql lib/crm/status.ts tests/crm/status.test.ts
git commit -m "feat(crm): client status/contact migration + pure status domain"
```

---

### Task 2: Data layer — Business gains status + contact fields

**Files:**
- Modify: `lib/replydesk/types.ts` (Business type only)
- Modify: `lib/replydesk/db.ts` (`rowToBusiness`, `updateBusiness`)
- Test: `tests/replydesk/db.test.ts` (extend the fake builder + add 3 tests)

**Interfaces:**
- Consumes: `ClientStatus` from `@/lib/crm/status` (Task 1).
- Produces: `Business` now includes `status: ClientStatus`, `contactName: string | null`, `contactEmail: string | null`, `contactPhone: string | null`. `updateBusiness(db, id, patch)` patch accepts the same four fields (camelCase) plus the existing `kbMd/voiceMd/name/reviewUrl`.

- [ ] **Step 1: Extend the fake builder and write the failing tests**

In `tests/replydesk/db.test.ts`, make three edits.

Edit 1 — the import line gains `updateBusiness` and `getBusiness`:

```ts
import { deleteBusiness, countReviews, updateBusiness, getBusiness } from "@/lib/replydesk/db";
```

Edit 2 — replace the `fakeDb` helper with this version (adds `update`/`single` methods and a `data` result key; existing tests are unaffected because they never pass `data`):

```ts
function fakeDb(result: {
  error?: { message: string } | null;
  count?: number | null;
  data?: unknown;
}) {
  const calls: Call[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {};
  for (const m of ["from", "delete", "select", "eq", "update", "single"]) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => void) =>
    resolve({
      error: result.error ?? null,
      count: result.count ?? null,
      data: result.data ?? null,
    });
  return { db: builder as unknown as SupabaseClient, calls };
}
```

Edit 3 — append these two describe blocks at the end of the file:

```ts
describe("updateBusiness", () => {
  it("maps camelCase patch fields to snake_case columns", async () => {
    const { db, calls } = fakeDb({ error: null });
    await updateBusiness(db, "biz-1", {
      status: "active",
      contactName: "Sam",
      contactEmail: "sam@example.com",
      contactPhone: "555-1234",
      reviewUrl: null,
    });
    const update = calls.find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({
      status: "active",
      contact_name: "Sam",
      contact_email: "sam@example.com",
      contact_phone: "555-1234",
      review_url: null,
    });
    expect(calls).toContainEqual({ method: "eq", args: ["id", "biz-1"] });
  });

  it("omits fields not present in the patch", async () => {
    const { db, calls } = fakeDb({ error: null });
    await updateBusiness(db, "biz-1", { kbMd: "# kb" });
    const update = calls.find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({ kb_md: "# kb" });
  });
});

describe("getBusiness", () => {
  it("maps snake_case business columns to the Business shape", async () => {
    const row = {
      id: "b1", name: "Pizza", review_url: null, kb_md: "", voice_md: "",
      created_at: "2026-01-01", status: "active", contact_name: "Sam",
      contact_email: null, contact_phone: "555-1234",
    };
    const { db } = fakeDb({ data: row });
    expect(await getBusiness(db, "b1")).toEqual({
      id: "b1", name: "Pizza", reviewUrl: null, kbMd: "", voiceMd: "",
      createdAt: "2026-01-01", status: "active", contactName: "Sam",
      contactEmail: null, contactPhone: "555-1234",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run tests/replydesk/db.test.ts`
Expected: the 2 `updateBusiness` tests FAIL (patch type/mapping doesn't know the new fields — the `update` call object lacks `status`/`contact_*`), and the `getBusiness` test FAILS (mapped object lacks the four new keys). The 5 pre-existing tests still PASS.

- [ ] **Step 3: Extend the Business type**

In `lib/replydesk/types.ts`, replace the `Business` type with (and add the import at the top of the file):

```ts
import type { ClientStatus } from "../crm/status";

export type Business = {
  id: string;
  name: string;
  reviewUrl: string | null;
  kbMd: string;
  voiceMd: string;
  createdAt: string;
  status: ClientStatus;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};
```

- [ ] **Step 4: Extend mapper + updateBusiness in db.ts**

In `lib/replydesk/db.ts`, add the import:

```ts
import type { ClientStatus } from "../crm/status";
```

Replace `rowToBusiness` with:

```ts
function rowToBusiness(r: any): Business {
  return {
    id: r.id, name: r.name, reviewUrl: r.review_url,
    kbMd: r.kb_md, voiceMd: r.voice_md, createdAt: r.created_at,
    status: r.status, contactName: r.contact_name,
    contactEmail: r.contact_email, contactPhone: r.contact_phone,
  };
}
```

Replace `updateBusiness` with:

```ts
export async function updateBusiness(
  db: SupabaseClient, id: string,
  patch: Partial<{
    kbMd: string; voiceMd: string; name: string; reviewUrl: string | null;
    status: ClientStatus; contactName: string | null;
    contactEmail: string | null; contactPhone: string | null;
  }>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.kbMd !== undefined) row.kb_md = patch.kbMd;
  if (patch.voiceMd !== undefined) row.voice_md = patch.voiceMd;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.reviewUrl !== undefined) row.review_url = patch.reviewUrl;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.contactName !== undefined) row.contact_name = patch.contactName;
  if (patch.contactEmail !== undefined) row.contact_email = patch.contactEmail;
  if (patch.contactPhone !== undefined) row.contact_phone = patch.contactPhone;
  const { error } = await db.from("businesses").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/replydesk/db.test.ts`
Expected: PASS — 8 tests (5 existing + 3 new).

- [ ] **Step 6: Typecheck + full suite**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npm test` — expected: 88 passing (85 + 3).

- [ ] **Step 7: Commit**

```bash
git add lib/replydesk/types.ts lib/replydesk/db.ts tests/replydesk/db.test.ts
git commit -m "feat(crm): business row gains status + contact fields"
```

---

### Task 3: updateClientSchema + action retrofit (update, delete guard, new paths)

**Files:**
- Modify: `app/admin/schemas.ts` (add one schema + one helper)
- Modify: `app/admin/actions.ts` (one new action, three modified, four revalidate targets)
- Test: `tests/admin/schemas.test.ts` (add one describe block)

**Interfaces:**
- Consumes: `STATUSES`, `canDeleteBusiness` from `@/lib/crm/status` (Task 1); `updateBusiness` extended patch, `getBusiness` (Task 2); existing `requireUser`, `getDb`, `deleteBusinessSchema`.
- Produces: `updateClientSchema` from `@/app/admin/schemas`; `updateClientDetailsAction(businessId: string, details: { status: string; contactName: string; contactEmail: string; contactPhone: string; reviewUrl: string }): Promise<{ error: string } | void>` from `@/app/admin/actions`. `deleteBusinessAction` now refuses non-leads with the verbatim guard copy and redirects to `/admin/clients`. `createBusinessAction` redirects to `/admin/clients/${b.id}`.

- [ ] **Step 1: Write the failing schema tests**

Append to `tests/admin/schemas.test.ts` (add `updateClientSchema` to the existing import from `@/app/admin/schemas`):

```ts
describe("updateClientSchema", () => {
  const base = {
    businessId: UUID,
    status: "active",
    contactName: "Sam",
    contactEmail: "sam@example.com",
    contactPhone: "555-1234",
    reviewUrl: "https://g.page/r/abc",
  };
  it("accepts a full valid update", () => {
    expect(updateClientSchema.parse(base)).toEqual(base);
  });
  it("nulls empty contact fields and non-http review links", () => {
    const out = updateClientSchema.parse({
      businessId: UUID, status: "lead",
      contactName: "  ", contactEmail: "", contactPhone: "", reviewUrl: "not a url",
    });
    expect(out).toEqual({
      businessId: UUID, status: "lead",
      contactName: null, contactEmail: null, contactPhone: null, reviewUrl: null,
    });
  });
  it("rejects an unknown status", () => {
    expect(updateClientSchema.safeParse({ ...base, status: "prospect" }).success).toBe(false);
  });
  it("rejects a malformed email", () => {
    expect(updateClientSchema.safeParse({ ...base, contactEmail: "not-an-email" }).success).toBe(false);
  });
  it("rejects a non-uuid businessId", () => {
    expect(updateClientSchema.safeParse({ ...base, businessId: "nope" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/admin/schemas.test.ts`
Expected: the 5 new tests FAIL (`updateClientSchema` is not exported); the 26 existing tests PASS.

- [ ] **Step 3: Add the schema**

Append to `app/admin/schemas.ts` (also add `import { STATUSES } from "@/lib/crm/status";` at the top, after the zod import):

```ts
// Empty-string inputs from cleared form fields degrade to null.
const optionalTrimmed = z.string().trim().transform((s) => (s === "" ? null : s));

export const updateClientSchema = z.object({
  businessId: z.uuid(),
  status: z.enum(STATUSES),
  contactName: optionalTrimmed,
  contactEmail: optionalTrimmed.pipe(z.email().nullable()),
  contactPhone: optionalTrimmed,
  reviewUrl: z.string().trim().transform((s) => (HTTP_URL_RE.test(s) ? s : null)),
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/admin/schemas.test.ts`
Expected: PASS — 31 tests (26 + 5).

- [ ] **Step 5: Retrofit actions.ts**

Make these exact changes in `app/admin/actions.ts`:

(a) Add to the imports: `canDeleteBusiness` from `@/lib/crm/status`, and `updateClientSchema` in the existing `./schemas` import list:

```ts
import { canDeleteBusiness } from "@/lib/crm/status";
```

(b) In `createBusinessAction`, change the redirect line to:

```ts
  redirect(`/admin/clients/${b.id}`);
```

(c) In `saveKbAction`, change the revalidate line to:

```ts
  revalidatePath(`/admin/clients/${input.businessId}/replydesk`);
```

(d) In `saveVoiceAction`, change the revalidate line to:

```ts
  revalidatePath(`/admin/clients/${input.businessId}/replydesk`);
```

(e) In `generateReplyAction`, change the revalidate line to:

```ts
  revalidatePath(`/admin/clients/${p.businessId}/replydesk`);
```

(f) In `markPostedAction`, change the revalidate line to:

```ts
  revalidatePath(`/admin/clients/${input.businessId}/replydesk`);
```

(g) Replace `deleteBusinessAction` in full:

```ts
export async function deleteBusinessAction(businessId: string): Promise<{ error: string } | void> {
  await requireUser();
  const input = deleteBusinessSchema.parse({ businessId });
  try {
    const db = getDb();
    const business = await getBusiness(db, input.businessId);
    if (!canDeleteBusiness(business.status)) {
      return { error: "Only leads can be deleted — set the status to Churned instead." };
    }
    await deleteBusiness(db, input.businessId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Delete failed — try again." };
  }
  redirect("/admin/clients");
}
```

(h) Add the new action after `deleteBusinessAction` (before `logoutAction`):

```ts
export async function updateClientDetailsAction(
  businessId: string,
  details: {
    status: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    reviewUrl: string;
  },
): Promise<{ error: string } | void> {
  await requireUser();
  const input = updateClientSchema.parse({ businessId, ...details });
  try {
    await updateBusiness(getDb(), input.businessId, {
      status: input.status,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      reviewUrl: input.reviewUrl,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Save failed — try again." };
  }
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
}
```

- [ ] **Step 6: Typecheck + full suite**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npm test` — expected: 93 passing (88 + 5).

- [ ] **Step 7: Commit**

```bash
git add app/admin/schemas.ts app/admin/actions.ts tests/admin/schemas.test.ts
git commit -m "feat(crm): update-client action, lead-only delete guard, new revalidate paths"
```

---

### Task 4: shadcn components + sidebar shell + redirects

**Files:**
- Create (via CLI): `components/ui/sidebar.tsx`, `components/ui/table.tsx`, `components/ui/badge.tsx` + sidebar's registry deps (`components/ui/{input,separator,sheet,skeleton,tooltip}.tsx`, `hooks/use-mobile.ts` — exact set is whatever the CLI emits as NEW files)
- Create: `components/admin/admin-sidebar.tsx`
- Modify: `app/admin/(protected)/layout.tsx` (full replacement)
- Modify: `app/admin/(protected)/page.tsx` (full replacement)
- Modify: `next.config.ts` (full replacement)

**Interfaces:**
- Consumes: `logoutAction` from `@/app/admin/actions`; `getAuthClient`/`userFromClaims` (Phase 1, unchanged).
- Produces: `AdminSidebar` from `@/components/admin/admin-sidebar`; shadcn `Table/TableBody/TableCell/TableHead/TableHeader/TableRow` and `Badge` available to Tasks 5-6.

No unit tests — UI shell. Gate: tsc + lint + build. NOTE: after this task `/admin` redirects to `/admin/clients`, which 404s until Task 5 — expected mid-branch; the build stays green.

- [ ] **Step 1: Add the shadcn components**

Run: `npx shadcn add --yes sidebar table badge`
(NEVER pass `--overwrite`. Registry availability was verified 2026-07-15.)

Then verify no marketing-shared file changed:

Run: `git status --short components/ui app/globals.css`
Expected: only NEW (`??`) files under `components/ui/` and `hooks/`; `components/ui/button.tsx`, `components/ui/accordion.tsx`, and `app/globals.css` show NO modification. If `app/globals.css` appears modified, run `git checkout -- app/globals.css` (its theme is already complete) and re-run the build at Step 6 to confirm nothing needed it.

- [ ] **Step 2: Create the admin sidebar**

Create `components/admin/admin-sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

// App-shell nav. Entries appear when their phase ships (Phase 2: Clients).
export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin" className="px-2 py-1.5 font-heading font-bold text-slate-900">
          FiveStar Local
          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            internal
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/admin/clients")}
                  render={<Link href="/admin/clients" />}
                >
                  <Users />
                  <span>Clients</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <form action={logoutAction}>
          <SidebarMenuButton type="submit">
            <LogOut />
            <span>Log out</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
```

(If tsc rejects the `render={<Link …/>}` prop shape, check how the generated `components/ui/sidebar.tsx` types `SidebarMenuButton` — base-nova uses Base UI's `useRender`; the `render` prop takes an element. Report a concern rather than switching to a different API shape.)

- [ ] **Step 3: Replace app/admin/(protected)/layout.tsx in full**

```tsx
import { redirect } from "next/navigation";
import { getAuthClient } from "@/app/admin/auth-client";
import { userFromClaims } from "@/lib/auth/claims";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getAuthClient();
  const { data } = await supabase.auth.getClaims();
  // login/ lives outside this route group, so every route this layout wraps
  // requires auth — no path-sniffing needed to let login render unguarded.
  if (!userFromClaims(data)) redirect("/admin/login");

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-slate-50 text-slate-800">
        <header className="flex h-12 items-center gap-2 border-b border-slate-200 bg-white px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-heading font-bold text-slate-900">FiveStar Local</span>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 4: Replace app/admin/(protected)/page.tsx in full**

```tsx
import { redirect } from "next/navigation";

// Interim home: Phase 4 replaces this redirect with the today-dashboard.
export default function AdminHome() {
  redirect("/admin/clients");
}
```

- [ ] **Step 5: Replace next.config.ts in full**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Pre-Phase-2 URL shape. Non-permanent while the tree still evolves.
        source: "/admin/businesses/:id",
        destination: "/admin/clients/:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 6: Typecheck, lint, build**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npm run lint` — expected: clean.
Run: `npm test` — expected: 93 passing (unchanged).
Run: `npm run build` — expected: compiles; route list still includes `/admin`, `/admin/login`, and the proxy.

- [ ] **Step 7: Commit (path-scoped — list the CLI-created files explicitly)**

```bash
git status --short   # identify the exact new components/ui + hooks files
git add components/ui/sidebar.tsx components/ui/table.tsx components/ui/badge.tsx \
        components/ui/input.tsx components/ui/separator.tsx components/ui/sheet.tsx \
        components/ui/skeleton.tsx components/ui/tooltip.tsx hooks/ \
        components/admin/admin-sidebar.tsx "app/admin/(protected)/layout.tsx" \
        "app/admin/(protected)/page.tsx" next.config.ts
git commit -m "feat(crm): shadcn sidebar shell, admin home redirect, businesses→clients redirect"
```

(Adjust the `components/ui` list to the CLI's actual output — add exactly the new files it created, nothing else. If the CLI touched `package.json`/`package-lock.json` with a new dep, include those two too.)

---

### Task 5: Client list — table, status filter, add form

**Files:**
- Create: `components/admin/status-badge.tsx`
- Create: `app/admin/(protected)/clients/page.tsx`

**Interfaces:**
- Consumes: `STATUSES`, `isClientStatus`, `ClientStatus` (Task 1); `Business.status/contactName/contactEmail` (Task 2); `createBusinessAction` (Task 3); `Table*`, `Badge` (Task 4).
- Produces: `StatusBadge({ status }: { status: ClientStatus })` from `@/components/admin/status-badge` — Task 6's header uses it.

No unit tests — server-rendered UI over already-tested pure logic. Gate: tsc + lint + build.

- [ ] **Step 1: Create the shared status badge**

Create `components/admin/status-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@/lib/crm/status";

// Single source of status badge styling (list rows + client-record header).
const BADGE_CLASSES: Record<ClientStatus, string> = {
  lead: "bg-slate-100 text-slate-600",
  active: "bg-ggreen/10 text-ggreen",
  paused: "bg-gyellow/15 text-yellow-700",
  churned: "bg-slate-100 text-slate-400",
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  return <Badge className={`capitalize ${BADGE_CLASSES[status]}`}>{status}</Badge>;
}
```

- [ ] **Step 2: Create the client list page**

Create `app/admin/(protected)/clients/page.tsx`:

```tsx
import Link from "next/link";
import { getDb, listBusinesses } from "@/lib/replydesk/db";
import { createBusinessAction } from "@/app/admin/actions";
import { STATUSES, isClientStatus } from "@/lib/crm/status";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function contactLine(name: string | null, email: string | null): string {
  const parts = [name, email].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-gblue px-3 py-1 text-xs font-medium capitalize text-white"
          : "rounded-full border border-slate-300 px-3 py-1 text-xs font-medium capitalize text-slate-600 hover:bg-slate-50"
      }
    >
      {label}
    </Link>
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && isClientStatus(status) ? status : null; // garbage → All
  const all = await listBusinesses(getDb());
  const clients = filter ? all.filter((b) => b.status === filter) : all;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Clients</h1>

      <form action={createBusinessAction} className="mt-6 flex flex-wrap gap-3">
        <input name="name" required placeholder="Client name"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
        <input name="reviewUrl" placeholder="Google review link (optional)"
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
        <button type="submit"
          className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90">
          Add client
        </button>
      </form>

      <div className="mt-8 flex flex-wrap gap-2">
        <FilterChip href="/admin/clients" label="All" active={filter === null} />
        {STATUSES.map((s) => (
          <FilterChip key={s} href={`/admin/clients?status=${s}`} label={s} active={filter === s} />
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-sm text-slate-500">
                  {filter ? `No ${filter} clients.` : "No clients yet — add your first above."}
                </TableCell>
              </TableRow>
            )}
            {clients.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium text-slate-900">
                  <Link href={`/admin/clients/${b.id}`} className="block hover:underline">
                    {b.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {contactLine(b.contactName, b.contactEmail)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck, lint, build**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npm run lint` — expected: clean.
Run: `npm run build` — expected: compiles; route list now includes `/admin/clients`.

- [ ] **Step 4: Commit**

```bash
git add components/admin/status-badge.tsx "app/admin/(protected)/clients/page.tsx"
git commit -m "feat(crm): client list — table, status filter, add form"
```

---

### Task 6: Client record shell — header layout, tabs, relocated ReplyDesk

**Files:**
- Create: `app/admin/(protected)/clients/[id]/layout.tsx`
- Create: `components/admin/client-tabs.tsx`
- Create: `app/admin/(protected)/clients/[id]/replydesk/page.tsx`
- Delete: `app/admin/(protected)/businesses/[id]/page.tsx` (via `git rm`)

**Interfaces:**
- Consumes: `getBusiness`, `listReviews`, `getDb` (existing); `StatusBadge` (Task 5); `KbBuilder`, `ReplyWorkspace` (existing, unchanged).
- Produces: the `[id]` layout that Task 7's Overview page renders inside; `ClientTabs({ clientId }: { clientId: string })`.

No unit tests — routing/relocation of already-tested components. Gate: tsc + lint + build. NOTE: `/admin/clients/[id]` (Overview) 404s until Task 7 — expected mid-branch.

- [ ] **Step 1: Create the tab links component**

Create `components/admin/client-tabs.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Phase 3 adds { label: "Timeline", segment: "/timeline" }; Phase 4 adds Tasks.
const TABS = [
  { label: "Overview", segment: "" },
  { label: "ReplyDesk", segment: "/replydesk" },
];

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}`;
  return (
    <nav className="flex gap-1 border-b border-slate-200">
      {TABS.map((t) => {
        const href = `${base}${t.segment}`;
        const active = pathname === href;
        return (
          <Link
            key={t.label}
            href={href}
            className={
              active
                ? "-mb-px border-b-2 border-gblue px-4 py-2 text-sm font-medium text-gblue"
                : "-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Create the client record layout**

Create `app/admin/(protected)/clients/[id]/layout.tsx`:

```tsx
import { getDb, getBusiness } from "@/lib/replydesk/db";
import { StatusBadge } from "@/components/admin/status-badge";
import { ClientTabs } from "@/components/admin/client-tabs";

export const dynamic = "force-dynamic";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await getBusiness(getDb(), id);
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-slate-900">{business.name}</h1>
          <StatusBadge status={business.status} />
        </div>
        {business.reviewUrl && /^https?:\/\//.test(business.reviewUrl) && (
          <a href={business.reviewUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm text-gblue hover:underline">
            Google review page ↗
          </a>
        )}
      </div>
      <ClientTabs clientId={business.id} />
      <div>{children}</div>
    </div>
  );
}
```

(The layout and each tab page both call `getBusiness` — two tiny selects per request on a force-dynamic route; deliberate, no caching layer needed at this scale.)

- [ ] **Step 3: Create the ReplyDesk tab page**

Create `app/admin/(protected)/clients/[id]/replydesk/page.tsx`:

```tsx
import { getDb, getBusiness, listReviews } from "@/lib/replydesk/db";
import { KbBuilder } from "@/components/admin/kb-builder";
import { ReplyWorkspace } from "@/components/admin/reply-workspace";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // KB builds fetch several pages; default 10s is too tight

export default async function ClientReplyDeskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const business = await getBusiness(db, id);
  // Show only POSTED rows in the Recent-reviews log. Every generate inserts a
  // `draft` audit row; those live only in the transient workspace card, so
  // filtering here keeps regenerations from cluttering the log. The DB insert
  // stays as the audit trail. (See docs/replydesk/DECISIONS.md.)
  const reviews = (await listReviews(db, id, 50)).filter((r) => r.status === "posted");

  return (
    <div className="space-y-8">
      <KbBuilder business={business} />
      <ReplyWorkspace business={business} reviews={reviews} />
    </div>
  );
}
```

- [ ] **Step 4: Delete the old business page**

Run: `git rm "app/admin/(protected)/businesses/[id]/page.tsx"`
(The empty `businesses/` directory disappears from routing; the next.config redirect from Task 4 covers old URLs.)

- [ ] **Step 5: Typecheck, lint, build**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npm run lint` — expected: clean.
Run: `npm run build` — expected: compiles; route list includes `/admin/clients/[id]/replydesk` and NO `/admin/businesses/[id]`.

- [ ] **Step 6: Commit**

```bash
git add components/admin/client-tabs.tsx "app/admin/(protected)/clients/[id]/layout.tsx" \
        "app/admin/(protected)/clients/[id]/replydesk/page.tsx"
git commit -m "feat(crm): tabbed client record shell, relocate ReplyDesk tab"
```

(The `git rm` from Step 4 is already staged and rides along in this commit.)

---

### Task 7: Overview tab — details form + guarded danger zone

**Files:**
- Create: `components/admin/client-details-form.tsx`
- Create: `app/admin/(protected)/clients/[id]/page.tsx`

**Interfaces:**
- Consumes: `updateClientDetailsAction` (Task 3, exact signature in Task 3's Interfaces); `STATUSES`, `ClientStatus`, `canDeleteBusiness` (Task 1); `Business` (Task 2); `DeleteBusiness` (existing: props `businessId: string; businessName: string; reviewCount: number`); `countReviews`, `getBusiness`, `getDb` (existing); the `[id]` layout (Task 6).
- Produces: nothing later tasks rely on.

No unit tests — thin client component over the Task 3 action (schema + guard already unit-tested). Gate: tsc + lint + build + full suite.

- [ ] **Step 1: Create the details form**

Create `components/admin/client-details-form.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { updateClientDetailsAction } from "@/app/admin/actions";
import { STATUSES, type ClientStatus } from "@/lib/crm/status";
import type { Business } from "@/lib/replydesk/types";

const FIELD =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue";

export function ClientDetailsForm({ business }: { business: Business }) {
  const [status, setStatus] = useState<ClientStatus>(business.status);
  const [contactName, setContactName] = useState(business.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(business.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(business.contactPhone ?? "");
  const [reviewUrl, setReviewUrl] = useState(business.reviewUrl ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setMsg(null);
      setErr(null);
      try {
        const res = await updateClientDetailsAction(business.id, {
          status, contactName, contactEmail, contactPhone, reviewUrl,
        });
        if (res?.error) setErr(res.error);
        else setMsg("Saved.");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Save failed — try again.");
      }
    });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-heading text-lg font-bold text-slate-900">Details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClientStatus)}
            className={`${FIELD} capitalize`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Contact name
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={FIELD} />
        </label>
        <label className="text-sm text-slate-600">
          Contact email
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={FIELD} />
        </label>
        <label className="text-sm text-slate-600">
          Contact phone
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={FIELD} />
        </label>
        <label className="text-sm text-slate-600 sm:col-span-2">
          Google review link
          <input
            value={reviewUrl}
            onChange={(e) => setReviewUrl(e.target.value)}
            placeholder="https://g.page/r/…"
            className={FIELD}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
        {msg && <p className="text-sm text-ggreen">{msg}</p>}
        {err && <p className="text-sm text-gred">{err}</p>}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the Overview page**

Create `app/admin/(protected)/clients/[id]/page.tsx`:

```tsx
import { getDb, getBusiness, countReviews } from "@/lib/replydesk/db";
import { canDeleteBusiness } from "@/lib/crm/status";
import { ClientDetailsForm } from "@/components/admin/client-details-form";
import { DeleteBusiness } from "@/components/admin/delete-business";

export const dynamic = "force-dynamic";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const business = await getBusiness(db, id);
  const reviewCount = await countReviews(db, id);

  return (
    <div className="space-y-8">
      <ClientDetailsForm business={business} />
      {canDeleteBusiness(business.status) ? (
        <DeleteBusiness
          businessId={business.id}
          businessName={business.name}
          reviewCount={reviewCount}
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900">Danger zone</h2>
          <p className="mt-2 text-sm text-slate-600">
            Clients with history can&apos;t be deleted. To retire this client, set the
            status to <span className="font-semibold">Churned</span> above — the record
            and its timeline stay intact.
          </p>
        </section>
      )}
    </div>
  );
}
```

(The delete button is hidden for non-leads AND `deleteBusinessAction` refuses them server-side — Task 3. UI hiding alone would not be a guard.)

- [ ] **Step 3: Typecheck, lint, build, full suite**

Run: `npx tsc --noEmit` — expected: clean.
Run: `npm run lint` — expected: clean.
Run: `npm test` — expected: 93 passing.
Run: `npm run build` — expected: compiles; route list includes `/admin/clients`, `/admin/clients/[id]`, `/admin/clients/[id]/replydesk`.

- [ ] **Step 4: Commit**

```bash
git add components/admin/client-details-form.tsx "app/admin/(protected)/clients/[id]/page.tsx"
git commit -m "feat(crm): overview tab — client details form + guarded danger zone"
```

---

### Task 8: Docs — context maps, SPEC access line, DECISIONS entry

**Files:**
- Modify: `app/admin/CLAUDE.md` (MAP section replacement)
- Modify: `components/admin/CLAUDE.md` (MAP additions)
- Modify: `lib/replydesk/CLAUDE.md` (one MAP line)
- Create: `lib/crm/CLAUDE.md`
- Modify: `docs/replydesk/SPEC.md` (one line)
- Modify: `docs/replydesk/DECISIONS.md` (append only)

**Interfaces:** none — docs only.

No tests. Gate: content accuracy (verified against the shipped tree) + append-only DECISIONS.

- [ ] **Step 1: Replace the MAP section of app/admin/CLAUDE.md**

Keep the header, intro, and INVARIANTS untouched. Replace everything from the `MAP` line through the last MAP bullet (currently ending with the `(protected)/businesses/[id]/` bullet) with:

```markdown
MAP
- login/ — email+password sign-in form (Supabase Auth signInWithPassword; the
  @supabase/ssr cookie adapter sets the session cookies, not the action). Lives
  OUTSIDE the (protected) route group so it renders without the guard and
  without a redirect loop.
- (protected)/layout.tsx — auth guard + shadcn sidebar shell (AdminSidebar +
  SidebarInset). A route group (no URL segment): everything placed inside it
  requires a valid session; login/ is a sibling, not a child, so it is never
  subject to this guard.
- (protected)/page.tsx — interim redirect to /admin/clients (Phase 4 replaces
  it with the today-dashboard).
- (protected)/clients/page.tsx — client list: status filter chips, table,
  add-client form.
- (protected)/clients/[id]/layout.tsx — client header (name, status badge,
  review link) + tab links (Overview | ReplyDesk).
- (protected)/clients/[id]/page.tsx — Overview tab: details form + lead-only
  danger zone (churned guidance for non-leads; server enforces the guard).
- (protected)/clients/[id]/replydesk/page.tsx — KB builder + reply workspace
  (client components in components/admin/).
- Old /admin/businesses/:id URLs 307-redirect to /admin/clients/:id
  (next.config.ts redirects()).
```

- [ ] **Step 2: Extend the MAP of components/admin/CLAUDE.md**

Append these bullets to the existing MAP list (keep the existing kb-builder and reply-workspace bullets):

```markdown
- delete-business.tsx — type-the-name hard delete danger zone. Lead-only:
  the Overview page hides it for non-leads and deleteBusinessAction refuses
  them server-side.
- admin-sidebar.tsx — shadcn sidebar nav (Clients + logout); active state
  via usePathname. New entries appear as phases ship.
- status-badge.tsx — ClientStatus → themed Badge; the single source of
  status badge classes (list rows + client-record header).
- client-tabs.tsx — Overview/ReplyDesk tab links for the client record;
  active by exact pathname match.
- client-details-form.tsx — status select + contact/review-link fields;
  calls updateClientDetailsAction, renders its {error} inline.
```

- [ ] **Step 3: Update one MAP line in lib/replydesk/CLAUDE.md**

Replace the line:
`- types.ts — shared types (Business, Review, GateReport, GeneratedReply)`
with:
`- types.ts — shared types (Business — incl. CRM status/contact fields typed via lib/crm/status —, Review, GateReport, GeneratedReply)`

- [ ] **Step 4: Create lib/crm/CLAUDE.md**

```markdown
# lib/crm — CRM domain

Pure, dependency-injected CRM logic. Sibling of lib/replydesk with the same
rules (see docs/superpowers/specs/2026-07-14-crm-evolution-design.md).

INVARIANTS
- Nothing in this tree imports from `next/*` or constructs clients. Plain TS.

MAP
- status.ts — client status enum (STATUSES, ClientStatus), isClientStatus,
  canDeleteBusiness (the lead-only hard-delete rule).

TESTS: tests/crm/
```

- [ ] **Step 5: Fix the stale access line in docs/replydesk/SPEC.md**

Replace the line:
`become customer-facing later. Access: one shared passcode.`
with:
`become customer-facing later. Access: individual founder accounts (Supabase Auth, email + password).`

- [ ] **Step 6: Append the DECISIONS.md entry (at the very end of the file)**

```markdown
## 2026-07-15 — Phase 2: CRM shell (clients, sidebar, tabbed record)
businesses rows are now client records: status (lead|active|paused|churned,
default lead, check-constrained; migration 0003) plus contact fields, edited
on the client Overview tab (updateClientDetailsAction). Routes moved to
/admin/clients with nested-route tabs (Overview | ReplyDesk — later phases
add folders, not edits); /admin/businesses/:id 307-redirects via
next.config.ts; /admin redirects to the client list until Phase 4's
dashboard. Hard delete is now LEAD-ONLY, enforced server-side in
deleteBusinessAction via lib/crm/status.canDeleteBusiness — non-leads are
set to churned instead (record + history kept). Admin shell uses shadcn/ui
(base-nova registry; sidebar/table/badge copied in) themed to existing
tokens; marketing-shared files (ui/button, ui/accordion, globals.css)
untouched.
```

- [ ] **Step 7: Verify and commit**

Verify: `git diff docs/replydesk/DECISIONS.md` shows ONLY added lines at the end (append-only).

```bash
git add app/admin/CLAUDE.md components/admin/CLAUDE.md lib/replydesk/CLAUDE.md \
        lib/crm/CLAUDE.md docs/replydesk/SPEC.md docs/replydesk/DECISIONS.md
git commit -m "docs(crm): sync context maps, SPEC access line, DECISIONS entry"
```

---

## Manual E2E checklist (human, after all tasks)

1. `/admin` (signed in) → lands on the client list; sidebar shows Clients.
2. Add a client → lands on its Overview tab.
3. Set status Active + contact fields → Save → header badge updates; list shows the contact.
4. Filter chips: Active shows it, Lead doesn't; `?status=garbage` shows all.
5. Overview of an Active client shows churned guidance (no delete button); a Lead shows the danger zone and delete works (→ back to list).
6. ReplyDesk tab: full generate → gate verdict → copy → mark posted flow works at the new path.
7. `/admin/businesses/<id>` redirects to `/admin/clients/<id>`.
8. Log out from the sidebar footer → back to login.
