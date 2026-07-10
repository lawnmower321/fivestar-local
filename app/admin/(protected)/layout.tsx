import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSession, SESSION_COOKIE } from "@/lib/replydesk/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const authed = isValidSession(jar.get(SESSION_COOKIE)?.value);
  // login/ lives outside this route group, so every route this layout wraps
  // requires auth — no path-sniffing needed to let login render unguarded.
  if (!authed) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/admin" className="font-heading font-bold text-slate-900">
            ReplyDesk
          </Link>
          <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
            internal
          </span>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
