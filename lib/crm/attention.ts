// Clients needing attention heuristic (spec 2026-07-31-phases-3-5-design.md,
// user-approved signals). Pure TS — callers fetch and pass plain data; pass
// ACTIVE clients only. Draft rows accumulate as an audit trail (regenerations
// insert new rows), so the draft signal reads only the LATEST row per client.

export const STALE_DAYS = 7;

export type ReviewMeta = {
  businessId: string;
  status: "draft" | "posted";
  createdAt: string;
  postedAt: string | null;
};

export type AttentionItem = { businessId: string; businessName: string; reasons: string[] };

export function buildAttention(
  clients: { id: string; name: string }[],
  reviews: ReviewMeta[],
  now: Date,
  staleDays: number = STALE_DAYS,
): AttentionItem[] {
  const cutoff = new Date(now.getTime() - staleDays * 86_400_000).toISOString();
  return clients.flatMap((c) => {
    const mine = reviews.filter((r) => r.businessId === c.id);
    const reasons: string[] = [];
    const latest = mine.reduce<ReviewMeta | null>(
      (best, r) => (!best || r.createdAt > best.createdAt ? r : best), null,
    );
    if (latest?.status === "draft") reasons.push("Latest reply draft was never posted");
    const lastPosted = mine.map((r) => r.postedAt).filter((p): p is string => p !== null).sort().at(-1) ?? null;
    if (lastPosted === null) reasons.push("No reply ever posted");
    else if (lastPosted < cutoff) reasons.push(`No reply posted in ${staleDays}+ days`);
    return reasons.length > 0 ? [{ businessId: c.id, businessName: c.name, reasons }] : [];
  });
}
