import Link from "next/link";
import { getDb, listBusinesses } from "@/lib/replydesk/db";
import { createBusinessAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const businesses = await listBusinesses(getDb());
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Businesses</h1>

      <form action={createBusinessAction} className="mt-6 flex flex-wrap gap-3">
        <input name="name" required placeholder="Business name"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
        <input name="reviewUrl" placeholder="Google review link (optional)"
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
        <button type="submit"
          className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90">
          Add business
        </button>
      </form>

      <ul className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {businesses.length === 0 && (
          <li className="px-5 py-6 text-sm text-slate-500">
            No businesses yet — add your first customer above.
          </li>
        )}
        {businesses.map((b) => (
          <li key={b.id}>
            <Link href={`/admin/businesses/${b.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
              <span className="font-medium text-slate-900">{b.name}</span>
              <span className="text-xs text-slate-400">
                {b.kbMd ? "KB ready" : "KB missing"} · {b.voiceMd ? "voice ready" : "voice missing"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
