"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON, SUPABASE_CONFIGURED, SUPABASE_URL } from "@/lib/env";

// Returns a browser Supabase client, or null in demo mode.
export function createClient() {
  if (!SUPABASE_CONFIGURED) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}
