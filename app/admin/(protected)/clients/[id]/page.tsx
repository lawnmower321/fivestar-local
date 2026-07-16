import { notFound } from "next/navigation";
import { getDb, findBusiness, countReviews } from "@/lib/replydesk/db";
import { canDeleteBusiness } from "@/lib/crm/status";
import { ClientDetailsForm } from "@/components/admin/client-details-form";
import { DeleteBusiness } from "@/components/admin/delete-business";

export const dynamic = "force-dynamic";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const business = await findBusiness(db, id);
  if (!business) notFound();
  const reviewCount = await countReviews(db, id);

  return (
    <div className="space-y-8">
      <ClientDetailsForm business={business} />
      {canDeleteBusiness(business.status) ? (
        <DeleteBusiness
          businessId={business.id}
          businessName={business.name}
          reviewCount={reviewCount}
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-lg font-bold text-slate-900">Danger zone</h2>
          <p className="mt-2 text-sm text-slate-600">
            Clients with history can&apos;t be deleted. To retire this client, set the
            status to <span className="font-semibold">Churned</span> above — the record
            and its timeline stay intact.
          </p>
        </section>
      )}
    </div>
  );
}
