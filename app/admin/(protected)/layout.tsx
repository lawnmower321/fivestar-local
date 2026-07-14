import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthClient } from "@/app/admin/auth-client";
import { userFromClaims } from "@/lib/auth/claims";
import { logoutAction } from "@/app/admin/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getAuthClient();
  const { data } = await supabase.auth.getClaims();
  // login/ lives outside this route group, so every route this layout wraps
  // requires auth — no path-sniffing needed to let login render unguarded.
  if (!userFromClaims(data)) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/admin" className="font-heading font-bold text-slate-900">
            ReplyDesk
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
              internal
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Log out
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
