"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Phase 3 adds { label: "Timeline", segment: "/timeline" }; Phase 4 adds Tasks.
const TABS = [
  { label: "Overview", segment: "" },
  { label: "ReplyDesk", segment: "/replydesk" },
];

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}`;
  return (
    <nav className="flex gap-1 border-b border-slate-200">
      {TABS.map((t) => {
        const href = `${base}${t.segment}`;
        const active = pathname === href;
        return (
          <Link
            key={t.label}
            href={href}
            className={
              active
                ? "-mb-px border-b-2 border-gblue px-4 py-2 text-sm font-medium text-gblue"
                : "-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
