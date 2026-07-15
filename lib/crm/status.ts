// CRM client-status domain: single source for the status values used by the
// DB check constraint (migration 0003), the zod schema, badges, filter
// chips, and the delete guard. Pure TS — no next/*, no clients.
export const STATUSES = ["lead", "active", "paused", "churned"] as const;
export type ClientStatus = (typeof STATUSES)[number];

export function isClientStatus(v: string): v is ClientStatus {
  return (STATUSES as readonly string[]).includes(v);
}

// Hard delete is allowed only while a record is still a lead; anything
// further along is set to "churned" instead (record + history preserved).
export function canDeleteBusiness(status: ClientStatus): boolean {
  return status === "lead";
}
