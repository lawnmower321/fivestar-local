import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the Supabase session cookies for /admin requests. REFRESH ONLY:
// the redirect-to-login guard stays in app/admin/(protected)/layout.tsx, so
// a proxy misconfiguration can never silently unguard a page.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return supabaseResponse;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });
  // IMPORTANT: no code between createServerClient and getClaims() —
  // per Supabase docs, anything in between can cause random logouts.
  await supabase.auth.getClaims();
  return supabaseResponse;
}

export const config = { matcher: "/admin/:path*" };
