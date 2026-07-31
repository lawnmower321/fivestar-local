import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteBusiness, countReviews, updateBusiness, getBusiness, findBusiness,
  recentPostedAcrossClients, listReviewMeta,
} from "@/lib/replydesk/db";

type Call = { method: string; args: unknown[] };

function fakeDb(result: {
  error?: { message: string } | null;
  count?: number | null;
  data?: unknown;
}) {
  const calls: Call[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {};
  for (const m of [
    "from", "delete", "select", "eq", "update", "single", "maybeSingle",
    "in", "not", "order", "limit", "insert",
  ]) {
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

describe("findBusiness", () => {
  it("maps snake_case business columns to the Business shape when found", async () => {
    const row = {
      id: "biz-1", name: "Joe's", review_url: null, kb_md: null, voice_md: null,
      created_at: "2026-01-01", status: "lead", contact_name: null,
      contact_email: null, contact_phone: null,
    };
    const { db, calls } = fakeDb({ data: row });
    const result = await findBusiness(db, "biz-1");
    expect(result).toEqual({
      id: "biz-1", name: "Joe's", reviewUrl: null, kbMd: null, voiceMd: null,
      createdAt: "2026-01-01", status: "lead", contactName: null,
      contactEmail: null, contactPhone: null,
    });
    expect(calls).toContainEqual({ method: "from", args: ["businesses"] });
    expect(calls).toContainEqual({ method: "eq", args: ["id", "biz-1"] });
    expect(calls.some((c) => c.method === "maybeSingle")).toBe(true);
  });

  it("resolves to null when the row is missing, without throwing", async () => {
    const { db } = fakeDb({ data: null });
    await expect(findBusiness(db, "missing-id")).resolves.toBeNull();
  });

  it("throws the Supabase error message on failure", async () => {
    const { db } = fakeDb({ error: { message: "boom" } });
    await expect(findBusiness(db, "biz-1")).rejects.toThrow("boom");
  });
});

describe("recentPostedAcrossClients", () => {
  it("joins the business name and filters to posted", async () => {
    const rows = [{
      id: "r1", business_id: "b1", rating: 5, reviewer: "Ann", review_text: "great",
      reply_text: "thanks", detail_referenced: null, similarity: 0.1, flags: [],
      status: "posted", created_at: "2026-07-30T00:00:00Z",
      posted_at: "2026-07-30T01:00:00Z", businesses: { name: "Joe's" },
    }];
    const { db, calls } = fakeDb({ data: rows });
    const out = await recentPostedAcrossClients(db);
    expect(out[0].businessName).toBe("Joe's");
    expect(out[0].review.id).toBe("r1");
    expect(calls).toContainEqual({ method: "eq", args: ["status", "posted"] });
    expect(calls).toContainEqual({ method: "order", args: ["posted_at", { ascending: false }] });
    expect(calls).toContainEqual({ method: "limit", args: [20] });
  });
});

describe("listReviewMeta", () => {
  it("returns [] for an empty id list without querying", async () => {
    const { db, calls } = fakeDb({ data: [] });
    expect(await listReviewMeta(db, [])).toEqual([]);
    expect(calls).toHaveLength(0);
  });
  it("maps rows and scopes to the given business ids", async () => {
    const rows = [{ business_id: "b1", status: "draft", created_at: "2026-07-30T00:00:00Z", posted_at: null }];
    const { db, calls } = fakeDb({ data: rows });
    expect(await listReviewMeta(db, ["b1", "b2"])).toEqual([
      { businessId: "b1", status: "draft", createdAt: "2026-07-30T00:00:00Z", postedAt: null },
    ]);
    expect(calls).toContainEqual({ method: "in", args: ["business_id", ["b1", "b2"]] });
  });
});
