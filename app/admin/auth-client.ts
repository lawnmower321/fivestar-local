import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// AUTH client only: sign-in/out + session validation via the server-only
// publishable key. Data access stays on the service-role client
// (lib/replydesk/db.ts getDb) — this client never reads or writes rows.
export async function getAuthClient(): Promise<SupabaseClient> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set");
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't set cookies mid-render. Safe to ignore:
          // proxy.ts owns session refresh (documented Supabase pattern).
        }
      },
    },
  });
}
