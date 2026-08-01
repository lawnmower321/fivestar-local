import Link from "next/link";
import { getDb, listBusinesses, recentPostedAcrossClients, listReviewMeta } from "@/lib/replydesk/db";
import { buildAttention } from "@/lib/crm/attention";

export const dynamic = "force-dynamic";

export default async function ReplyQueuePage() {
  const db = getDb();
  const businesses = await listBusinesses(db);
  const active = businesses.filter((b) => b.status === "active").map((b) => ({ id: b.id, name: b.name }));
  const [reviewMeta, recent] = await Promise.all([
    listReviewMeta(db, active.map((c) => c.id)),
    recentPostedAcrossClients(db, 20),
  ]);
  const attention = buildAttention(active, reviewMeta, new Date());
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Reply queue</h1>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Needs attention
        </h2>
        {attention.length === 0 ? (
          <p className="text-sm text-slate-500">All active clients are covered — nothing pending.</p>
        ) : (
          <ul className="space-y-2">
            {attention.map((a) => (
              <li key={a.businessId} className="rounded-xl border border-gyellow/60 bg-gyellow/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">{a.businessName}</p>
                  <Link href={`/admin/clients/${a.businessId}/replydesk`} className="shrink-0 text-sm text-gblue hover:underline">
                    Open ReplyDesk →
                  </Link>
                </div>
                <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
                  {a.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Recent replies
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No posted replies yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map(({ review, businessName }) => (
              <li key={review.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-400">
                  {businessName ? (
                    <Link href={`/admin/clients/${review.businessId}/replydesk`} className="font-medium text-slate-600 hover:text-gblue hover:underline">
                      {businessName}
                    </Link>
                  ) : (
                    "Unknown client"
                  )}
                  {" · "}
                  <span role="img" aria-label={`${review.rating} stars`}>
                    <span aria-hidden="true">{"★".repeat(review.rating)}</span>
                  </span>
                  {review.reviewer && ` · ${review.reviewer}`}
                  {review.postedAt && ` · ${new Date(review.postedAt).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "America/New_York" })}`}
                </p>
                {review.replyText && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-700">{review.replyText}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
