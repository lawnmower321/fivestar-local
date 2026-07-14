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
    expect(calls).toContainEqual({ method: "select", args: ["*", { count: "exact", head: true }] });
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
