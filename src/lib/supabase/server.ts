import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON, SUPABASE_CONFIGURED, SUPABASE_URL } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

// Server component / route-handler client (reads + refreshes the session
// via cookies). Returns null in demo mode so callers fall back to seed data.
// Async because Next.js 15+ `cookies()` returns a Promise.
export async function createClient() {
  if (!SUPABASE_CONFIGURED) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as any)
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
