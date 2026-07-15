import Link from "next/link";
import { getDb, listBusinesses } from "@/lib/replydesk/db";
import { createBusinessAction } from "@/app/admin/actions";
import { STATUSES, isClientStatus } from "@/lib/crm/status";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function contactLine(name: string | null, email: string | null): string {
  const parts = [name, email].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-gblue px-3 py-1 text-xs font-medium capitalize text-white"
          : "rounded-full border border-slate-300 px-3 py-1 text-xs font-medium capitalize text-slate-600 hover:bg-slate-50"
      }
    >
      {label}
    </Link>
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && isClientStatus(status) ? status : null; // garbage → All
  const all = await listBusinesses(getDb());
  const clients = filter ? all.filter((b) => b.status === filter) : all;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Clients</h1>

      <form action={createBusinessAction} className="mt-6 flex flex-wrap gap-3">
        <input name="name" required placeholder="Client name"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
        <input name="reviewUrl" placeholder="Google review link (optional)"
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
        <button type="submit"
          className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90">
          Add client
        </button>
      </form>

      <div className="mt-8 flex flex-wrap gap-2">
        <FilterChip href="/admin/clients" label="All" active={filter === null} />
        {STATUSES.map((s) => (
          <FilterChip key={s} href={`/admin/clients?status=${s}`} label={s} active={filter === s} />
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-sm text-slate-500">
                  {filter ? `No ${filter} clients.` : "No clients yet — add your first above."}
                </TableCell>
              </TableRow>
            )}
            {clients.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium text-slate-900">
                  <Link href={`/admin/clients/${b.id}`} className="block hover:underline">
                    {b.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {contactLine(b.contactName, b.contactEmail)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
