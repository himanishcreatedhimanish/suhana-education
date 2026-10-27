import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON, SUPABASE_CONFIGURED, SUPABASE_URL } from "@/lib/env";

// Server component / route-handler client (reads + refreshes the session
// via cookies). Returns null in demo mode so callers fall back to seed data.
export function createClient() {
  if (!SUPABASE_CONFIGURED) return null;
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}

// Service-role client — SERVER ONLY. Bypasses RLS. Never import in client code.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_CONFIGURED || !key) return null;
  return createServerClient(SUPABASE_URL, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
