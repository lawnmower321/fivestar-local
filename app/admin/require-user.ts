import { getAuthClient } from "./auth-client";
import { userFromClaims } from "@/lib/auth/claims";

// Server actions POST to their own endpoints and are NOT covered by the
// (protected) route-group layout (that guards page rendering only). Every
// action must call this first so an unauthenticated caller cannot invoke it.
export async function requireUser(): Promise<{ id: string }> {
  const supabase = await getAuthClient();
  const { data } = await supabase.auth.getClaims();
  const user = userFromClaims(data);
  if (!user) throw new Error("unauthorized");
  return user;
}
