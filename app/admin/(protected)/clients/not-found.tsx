import Link from "next/link";

export default function ClientNotFound() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="font-heading text-xl font-bold text-slate-900">Client not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        This client may have been deleted, or the link is out of date.
      </p>
      <Link href="/admin/clients" className="mt-4 inline-block text-sm text-gblue hover:underline">
        ← Back to all clients
      </Link>
    </div>
  );
}
