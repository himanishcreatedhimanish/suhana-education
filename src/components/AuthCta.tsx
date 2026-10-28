"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";

// Auth-aware call-to-action. Shows "create account" to logged-out visitors and
// a "go to dashboard" link to authenticated students, so public sign-up CTAs
// never appear once a student is logged in. Renders the logged-out link first
// (matches the server render) and swaps after the auth check resolves.
export default function AuthCta({
  className = "btn",
  loggedOutLabel = "Create your free account",
  loggedInLabel = "Go to my dashboard",
}: {
  className?: string;
  loggedOutLabel?: string;
  loggedInLabel?: string;
}) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;
    if (SUPABASE_CONFIGURED) {
      const supabase = createClient();
      supabase?.auth.getUser().then(({ data }) => { if (active) setAuthed(!!data.user); });
    } else {
      const u = getDemoUser();
      setAuthed(!!(u && u.full_name));
    }
    return () => { active = false; };
  }, []);

  return authed
    ? <Link className={className} href="/dashboard">{loggedInLabel}</Link>
    : <Link className={className} href="/login">{loggedOutLabel}</Link>;
}
