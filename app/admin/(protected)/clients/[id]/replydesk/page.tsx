import { getDb, getBusiness, listReviews } from "@/lib/replydesk/db";
import { KbBuilder } from "@/components/admin/kb-builder";
import { ReplyWorkspace } from "@/components/admin/reply-workspace";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // KB builds fetch several pages; default 10s is too tight

export default async function ClientReplyDeskPage({
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

  return (
    <div className="space-y-8">
      <KbBuilder business={business} />
      <ReplyWorkspace business={business} reviews={reviews} />
    </div>
  );
}
