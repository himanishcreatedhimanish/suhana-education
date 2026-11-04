"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { XIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";

// First-visit admissions dialog for the public homepage. Appears once per
// browser session (sessionStorage), only for logged-out visitors, and can be
// dismissed with the close button, a click on the backdrop, or Escape.
const SEEN_KEY = "suhana-join-popup.v1";

export default function WelcomePopup() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
  }, []);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch {}
    if (seen) return;
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | undefined;
    const showSoon = () => { if (!cancelled) t = setTimeout(() => setOpen(true), 1200); };
    if (SUPABASE_CONFIGURED) {
      const supabase = createClient();
      supabase?.auth.getUser().then(({ data }) => { if (!data.user) showSoon(); });
    } else {
      const u = getDemoUser();
      if (!(u && u.full_name)) showSoon();
    }
    return () => { cancelled = true; if (t) clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="join-bg" role="dialog" aria-modal="true" aria-labelledby="join-title" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="join-modal">
        <button className="join-x" onClick={close} aria-label="Close"><XIcon size={18} /></button>
        <div className="join-top lattice">
          <h2 id="join-title">Admissions for 2026–27 are open.</h2>
          <p>Live classes, study material and fortnightly exams for JKBOSE Classes 8, 9 and 10. Choose a plan for your class and start this week.</p>
        </div>
        <div className="join-rows">
          {PLANS.map((plan) => (
            <div className="join-row" key={plan.id}>
              <div>
                <b>{plan.name}</b>
                <span className="d">{plan.tagline}</span>
              </div>
              <div className="p">₹{plan.price.toLocaleString("en-IN")} <small>a year</small></div>
            </div>
          ))}
        </div>
        <div className="join-cta">
          <Link className="btn" href="/plans" onClick={close}>Compare plans</Link>
          <button className="btn ghost" onClick={close}>Not now</button>
        </div>
        <p className="join-fine">Creating an account is free. 18% GST is added to plan prices at checkout.</p>
      </div>
    </div>
  );
}
