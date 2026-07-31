// Clients needing attention heuristic (spec 2026-07-31-phases-3-5-design.md,
// user-approved signals). Pure TS — callers fetch and pass plain data; pass
// ACTIVE clients only. Draft rows accumulate as an audit trail (regenerations
// insert new rows), so the draft signal reads only the LATEST row per client.

// ReviewMeta is a projection of the reviews table (ReplyDesk domain), so it
// lives in lib/replydesk/types.ts beside Review, not here. Type-only import —
// erased at build time, so this file still emits no runtime dependency on
// lib/replydesk.
import type { ReviewMeta } from "../replydesk/types";
export type { ReviewMeta };

export const STALE_DAYS = 7;

export type AttentionItem = { businessId: string; businessName: string; reasons: string[] };

export function buildAttention(
  clients: { id: string; name: string }[],
  reviews: ReviewMeta[],
  now: Date,
  staleDays: number = STALE_DAYS,
): AttentionItem[] {
  const cutoffMs = now.getTime() - staleDays * 86_400_000;
  return clients.flatMap((c) => {
    const mine = reviews.filter((r) => r.businessId === c.id);
    const reasons: string[] = [];
    const latest = mine.reduce<ReviewMeta | null>(
      (best, r) => (!best || new Date(r.createdAt).getTime() > new Date(best.createdAt).getTime() ? r : best), null,
    );
    if (latest?.status === "draft") reasons.push("Latest reply draft was never posted");
    const lastPosted = mine
      .map((r) => r.postedAt)
      .filter((p): p is string => p !== null)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .at(-1) ?? null;
    if (lastPosted === null) reasons.push("No reply ever posted");
    else if (new Date(lastPosted).getTime() < cutoffMs) reasons.push(`No reply posted in ${staleDays}+ days`);
    return reasons.length > 0 ? [{ businessId: c.id, businessName: c.name, reasons }] : [];
  });
}
