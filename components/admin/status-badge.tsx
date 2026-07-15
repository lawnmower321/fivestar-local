import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@/lib/crm/status";

// Single source of status badge styling (list rows + client-record header).
const BADGE_CLASSES: Record<ClientStatus, string> = {
  lead: "bg-slate-100 text-slate-600",
  active: "bg-ggreen/10 text-ggreen",
  paused: "bg-gyellow/15 text-yellow-700",
  churned: "bg-slate-100 text-slate-400",
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  return <Badge className={`capitalize ${BADGE_CLASSES[status]}`}>{status}</Badge>;
}
