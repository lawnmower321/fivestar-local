import { describe, it, expect } from "vitest";
import { buildAttention, STALE_DAYS, type ReviewMeta } from "@/lib/crm/attention";

const NOW = new Date("2026-07-31T12:00:00Z");
const joes = { id: "b1", name: "Joe's" };

function meta(partial: Partial<ReviewMeta>): ReviewMeta {
  return { businessId: "b1", status: "posted", createdAt: "2026-07-30T00:00:00Z",
           postedAt: "2026-07-30T00:00:00Z", ...partial };
}

describe("buildAttention", () => {
  it("exposes the 7-day default", () => {
    expect(STALE_DAYS).toBe(7);
  });

  it("flags a client whose latest review row is an unposted draft", () => {
    const reviews = [
      meta({ createdAt: "2026-07-28T00:00:00Z" }),                                   // older posted
      meta({ status: "draft", createdAt: "2026-07-30T00:00:00Z", postedAt: null }),  // latest = draft
    ];
    const out = buildAttention([joes], reviews, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].reasons).toContain("Latest reply draft was never posted");
  });

  it("does not flag drafts that were superseded by a posted reply", () => {
    const reviews = [
      meta({ status: "draft", createdAt: "2026-07-28T00:00:00Z", postedAt: null }),  // audit-trail draft
      meta({ createdAt: "2026-07-30T00:00:00Z" }),                                   // latest = posted
    ];
    expect(buildAttention([joes], reviews, NOW)).toEqual([]);
  });

  it("flags no-reply-ever and stale clients distinctly", () => {
    expect(buildAttention([joes], [], NOW)[0].reasons).toEqual(["No reply ever posted"]);
    const stale = [meta({ createdAt: "2026-07-01T00:00:00Z", postedAt: "2026-07-01T00:00:00Z" })];
    expect(buildAttention([joes], stale, NOW)[0].reasons).toEqual(["No reply posted in 7+ days"]);
  });

  it("a recent posted reply keeps the client off the list", () => {
    const fresh = [meta({ postedAt: "2026-07-29T00:00:00Z" })];
    expect(buildAttention([joes], fresh, NOW)).toEqual([]);
  });

  it("collects multiple reasons on one row", () => {
    const reviews = [
      meta({ createdAt: "2026-07-01T00:00:00Z", postedAt: "2026-07-01T00:00:00Z" }),
      meta({ status: "draft", createdAt: "2026-07-30T00:00:00Z", postedAt: null }),
    ];
    const out = buildAttention([joes], reviews, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].reasons).toEqual([
      "Latest reply draft was never posted",
      "No reply posted in 7+ days",
    ]);
  });

  it("only reads each client's own reviews", () => {
    const other = [meta({ businessId: "b2", status: "draft", postedAt: null })];
    const out = buildAttention([joes], other, NOW);
    expect(out[0].reasons).toEqual(["No reply ever posted"]);
  });
});
