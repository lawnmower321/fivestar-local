import { cookies } from "next/headers";
import { isValidSession, SESSION_COOKIE } from "@/lib/replydesk/auth";

// Server actions POST to their own endpoints and are NOT covered by the
// (protected) route-group layout (that guards page rendering only). Every
// action must call this first so an unauthenticated caller cannot invoke it.
export async function requireSession(): Promise<void> {
  const jar = await cookies();
  if (!isValidSession(jar.get(SESSION_COOKIE)?.value)) {
    throw new Error("unauthorized");
  }
}
