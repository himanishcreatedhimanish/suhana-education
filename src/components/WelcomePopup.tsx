"use client";
import { useEffect, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { PLANS, priceBreakdown } from "@/lib/plans";
import { CheckIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";

// First-load "JOIN NOW" welcome popup for the public homepage.
// Shows the three plans with pricing and a CTA. Appears once per browser
// session (sessionStorage), can be dismissed via the X button, a click on
// the backdrop, or the Escape key, and locks background scroll while open.
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
    const showSoon = () => { if (!cancelled) t = setTimeout(() => setOpen(true), 700); };
    // Only greet logged-out visitors — never show the join/sign-up popup to a student.
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
    <div
      className="join-bg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-title"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="join-modal">
        <button className="join-x" onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={18} height={18}><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className="join-head">
          <span className="join-kicker">★ Admissions open · 2026–27</span>
          <h2 id="join-title">Join <span className="grad">Suhana Education</span> today</h2>
          <p>Live classes, recorded lectures, study material and test series for JKBOSE Class 8, 9 &amp; 10. Pick a plan and start learning in minutes.</p>
        </div>

        <div className="join-plans">
          {PLANS.map((plan) => {
            const { price } = priceBreakdown(plan.price);
            return (
              <div key={plan.id} className={"join-plan" + (plan.popular ? " popular" : "")} style={{ "--pa": plan.accent } as CSSProperties}>
                {plan.popular && <span className="join-crown">Most popular</span>}
                <div className="join-pname">{plan.name.replace(" Plan", "")}</div>
                <div className="join-price"><b>₹{price.toLocaleString("en-IN")}</b><span>+ GST / yr</span></div>
                <ul>
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f}><CheckIcon size={15} /><span>{f}</span></li>
                  ))}
                  {plan.features.length > 4 && <li className="more"><span>+ {plan.features.length - 4} more</span></li>}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="join-cta">
          <Link className="btn join-primary" href="/plans" onClick={close}>Join now →</Link>
          <Link className="btn ghost" href="/courses" onClick={close}>Explore courses</Link>
        </div>
        <p className="join-fine">No card needed to create an account · Prices exclusive of 18% GST</p>
      </div>
    </div>
  );
}
