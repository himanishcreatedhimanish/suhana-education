"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";

// Sets <html data-authed="yes"> when a student is logged in, so account /
// sign-up oriented sections (marked .guest-only) are hidden for them. A tiny
// inline script in the layout sets this synchronously for demo mode to avoid
// any flash; this keeps it in sync for Supabase auth and login/logout changes.
export default function AuthMarker() {
  useEffect(() => {
    const set = (v: boolean) => {
      const el = document.documentElement;
      if (v) el.setAttribute("data-authed", "yes");
      else el.removeAttribute("data-authed");
    };
    if (SUPABASE_CONFIGURED) {
      const supabase = createClient();
      supabase?.auth.getUser().then(({ data }) => set(!!data.user));
      const sub = supabase?.auth.onAuthStateChange((_e, session) => set(!!session?.user));
      return () => sub?.data.subscription.unsubscribe();
    } else {
      const u = getDemoUser();
      set(!!(u && u.full_name));
    }
  }, []);
  return null;
}
