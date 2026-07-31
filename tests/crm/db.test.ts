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
