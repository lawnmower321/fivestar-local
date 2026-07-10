import { getDb, getBusiness, listReviews } from "@/lib/replydesk/db";
import { KbBuilder } from "@/components/admin/kb-builder";
import { ReplyWorkspace } from "@/components/admin/reply-workspace";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // KB builds fetch several pages; default 10s is too tight

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const business = await getBusiness(db, id);
  const reviews = await listReviews(db, id, 25);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">{business.name}</h1>
        {business.reviewUrl && (
          <a href={business.reviewUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm text-gblue hover:underline">
            Google review page ↗
          </a>
        )}
      </div>
      <KbBuilder business={business} />
      <ReplyWorkspace business={business} reviews={reviews} />
    </div>
  );
}
