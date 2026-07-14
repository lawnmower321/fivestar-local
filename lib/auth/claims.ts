// Pure claims → user extraction, unit-testable without Next or Supabase.
// Structurally compatible with the `data` returned by
// supabase.auth.getClaims() ({ claims } | null).
export type ClaimsData = { claims?: { sub?: unknown } | null } | null;

export function userFromClaims(data: ClaimsData): { id: string } | null {
  const sub = data?.claims?.sub;
  return typeof sub === "string" && sub.length > 0 ? { id: sub } : null;
}
