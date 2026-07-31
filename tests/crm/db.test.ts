import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  insertActivity, listActivities, deleteNoteActivity, listProfiles,
  createTask, listTasksForBusiness, listAllTasks, completeTask, reopenTask,
  deleteTask, listRecentActivities,
} from "@/lib/crm/db";

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
  it("deletes by id AND type=note AND business_id so non-notes and mismatched clients can never be deleted", async () => {
    const { db, calls } = fakeDb({ error: null });
    await deleteNoteActivity(db, "a1", "biz-1");
    expect(calls.some((c) => c.method === "delete")).toBe(true);
    expect(calls).toContainEqual({ method: "eq", args: ["id", "a1"] });
    expect(calls).toContainEqual({ method: "eq", args: ["type", "note"] });
    expect(calls).toContainEqual({ method: "eq", args: ["business_id", "biz-1"] });
  });
});

describe("listProfiles", () => {
  it("maps display_name to displayName", async () => {
    const { db, calls } = fakeDb({ data: [{ id: "u1", display_name: "Brendan" }] });
    expect(await listProfiles(db)).toEqual([{ id: "u1", displayName: "Brendan" }]);
    expect(calls).toContainEqual({ method: "select", args: ["id, display_name"] });
  });
});

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

describe("listTasksForBusiness", () => {
  it("queries newest-first for the business and maps rows", async () => {
    const row = {
      id: "t1", business_id: "biz-1", assignee: "u1", title: "Send invoice",
      due_date: "2026-08-01", status: "open", created_by: "u1",
      created_at: "2026-07-31T12:00:00Z", completed_at: null,
    };
    const { db, calls } = fakeDb({ data: [row] });
    const out = await listTasksForBusiness(db, "biz-1");
    expect(out).toEqual([{
      id: "t1", businessId: "biz-1", assignee: "u1", title: "Send invoice",
      dueDate: "2026-08-01", status: "open", createdBy: "u1",
      createdAt: "2026-07-31T12:00:00Z", completedAt: null,
    }]);
    expect(calls).toContainEqual({ method: "from", args: ["tasks"] });
    expect(calls).toContainEqual({ method: "eq", args: ["business_id", "biz-1"] });
    expect(calls).toContainEqual({ method: "order", args: ["created_at", { ascending: false }] });
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

  it("throws the Supabase error message instead of silently no-oping", async () => {
    const { db } = fakeDb({ error: { message: "update boom" } });
    await expect(completeTask(db, "t1")).rejects.toThrow("update boom");
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
