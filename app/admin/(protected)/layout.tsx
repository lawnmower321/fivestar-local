import { redirect } from "next/navigation";
import { getAuthClient } from "@/app/admin/auth-client";
import { userFromClaims } from "@/lib/auth/claims";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getAuthClient();
  const { data } = await supabase.auth.getClaims();
  // login/ lives outside this route group, so every route this layout wraps
  // requires auth — no path-sniffing needed to let login render unguarded.
  if (!userFromClaims(data)) redirect("/admin/login");

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-slate-50 text-slate-800">
        <header className="flex h-12 items-center gap-2 border-b border-slate-200 bg-white px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-heading font-bold text-slate-900">FiveStar Local</span>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
