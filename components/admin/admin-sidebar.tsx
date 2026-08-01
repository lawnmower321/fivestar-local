"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ListTodo, MessagesSquare, LogOut } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

// App-shell nav. Entries appear when their phase ships (Phase 2: Clients;
// Phase 4: Dashboard, Tasks; Phase 5: Reply queue). Dashboard uses an exact
// pathname match so it isn't highlighted on every /admin/* page;
// Clients/Tasks/Reply queue use prefix match (the Reply queue prefix is
// "/admin/replydesk", distinct from the per-client ReplyDesk tab under
// "/admin/clients/[id]/replydesk", so neither entry lights up for the
// other's route). "Reply queue" is deliberately not "ReplyDesk" — that name
// is reserved for the actual per-client reply workspace (client-tabs.tsx);
// this entry is the read-only cross-client dashboard over it.
export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin" className="px-2 py-1.5 font-heading font-bold text-slate-900">
          FiveStar Local
          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            internal
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/admin"}
                  render={<Link href="/admin" />}
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/admin/clients")}
                  render={<Link href="/admin/clients" />}
                >
                  <Users />
                  <span>Clients</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/admin/tasks")}
                  render={<Link href="/admin/tasks" />}
                >
                  <ListTodo />
                  <span>Tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith("/admin/replydesk")}
                  render={<Link href="/admin/replydesk" />}
                >
                  <MessagesSquare />
                  <span>Reply queue</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <form action={logoutAction}>
          <SidebarMenuButton type="submit">
            <LogOut />
            <span>Log out</span>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
