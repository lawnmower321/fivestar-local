import { notFound } from "next/navigation";
import { getDb, findBusiness } from "@/lib/replydesk/db";
import { StatusBadge } from "@/components/admin/status-badge";
import { ClientTabs } from "@/components/admin/client-tabs";

export const dynamic = "force-dynamic";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await findBusiness(getDb(), id);
  if (!business) notFound();
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-slate-900">{business.name}</h1>
          <StatusBadge status={business.status} />
        </div>
        {business.reviewUrl && /^https?:\/\//.test(business.reviewUrl) && (
          <a href={business.reviewUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm text-gblue hover:underline">
            Google review page ↗
          </a>
        )}
      </div>
      <ClientTabs clientId={business.id} />
      <div>{children}</div>
    </div>
  );
}
