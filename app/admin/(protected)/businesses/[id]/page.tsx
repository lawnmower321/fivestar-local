import { getDb, getBusiness, listReviews, countReviews } from "@/lib/replydesk/db";
import { KbBuilder } from "@/components/admin/kb-builder";
import { ReplyWorkspace } from "@/components/admin/reply-workspace";
import { DeleteBusiness } from "@/components/admin/delete-business";

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
  // Show only POSTED rows in the Recent-reviews log. Every generate inserts a
  // `draft` audit row; those live only in the transient workspace card, so
  // filtering here keeps regenerations from cluttering the log. The DB insert
  // stays as the audit trail. (See docs/replydesk/DECISIONS.md.)
  const reviews = (await listReviews(db, id, 50)).filter((r) => r.status === "posted");
  const reviewCount = await countReviews(db, id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">{business.name}</h1>
        {business.reviewUrl && /^https?:\/\//.test(business.reviewUrl) && (
          <a href={business.reviewUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm text-gblue hover:underline">
            Google review page ↗
          </a>
        )}
      </div>
      <KbBuilder business={business} />
      <ReplyWorkspace business={business} reviews={reviews} />
      <DeleteBusiness businessId={business.id} businessName={business.name} reviewCount={reviewCount} />
    </div>
  );
}
