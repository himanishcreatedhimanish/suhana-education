"use client";
import { useState, type CSSProperties } from "react";
import { PLANS, PLAN_CLASSES, ALL_FEATURES, priceBreakdown, type Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";
import { getState, setState } from "@/lib/clientState";
import { SUPABASE_CONFIGURED, RAZORPAY_PUBLIC_KEY } from "@/lib/env";
import { toast } from "@/components/toast";
import { CheckIcon } from "@/components/icons";

const RAZORPAY_READY = Boolean(RAZORPAY_PUBLIC_KEY) && SUPABASE_CONFIGURED;

declare global { interface Window { Razorpay?: any } }

function Cross({ size = 17 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
  );
}

export default function PlanCards({ initialClass = 9 }: { initialClass?: number }) {
  const [cls, setCls] = useState<number>(initialClass);
  const [busy, setBusy] = useState<string | null>(null);

  function loadRazorpay(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(); s.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(s);
    });
  }

  async function choose(plan: Plan) {
    const selectedClass = cls;
    // require login in live mode
    if (SUPABASE_CONFIGURED) {
      const supabase = createClient()!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login?next=/plans"; return; }
    }

    if (!RAZORPAY_READY) {
      // Demo subscription — no real charge.
      const { total } = priceBreakdown(plan.price);
      if (!confirm(`Demo checkout for ${plan.name} (Class ${selectedClass}) — ₹${total.toLocaleString("en-IN")} incl. GST. No real charge is made. Continue?`)) return;
      grantDemo(plan, selectedClass);
      return;
    }

    setBusy(plan.id);
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, class: selectedClass }),
      });
      const order = await orderRes.json();
      if (!order.id) throw new Error(order.error || "Could not create order");
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: RAZORPAY_PUBLIC_KEY, order_id: order.id, amount: order.amount, currency: "INR",
        name: "Suhana Education", description: `${plan.name} · Class ${selectedClass}`,
        handler: async (resp: any) => {
          const vr = await fetch("/api/payments/verify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...resp, planId: plan.id, class: selectedClass }),
          });
          const v = await vr.json();
          if (v.ok) { toast(`${plan.name} activated!`); window.location.href = "/dashboard"; }
          else toast("Payment could not be verified.");
        },
      });
      rzp.open();
    } catch (e: any) { toast(e.message || "Payment failed"); }
    finally { setBusy(null); }
  }

  function grantDemo(plan: Plan, selectedClass: number) {
    const s = getState();
    s.subscription = { planId: plan.id, planName: plan.name, class: selectedClass, at: Date.now() };
    s.notifications.unshift({ body: `${plan.name} activated for Class ${selectedClass}`, at: Date.now() });
    setState(s);
    toast(`${plan.name} activated!`);
    window.location.href = "/dashboard";
  }

  return (
    <>
      <ol className="enroll-steps" aria-label="Enrollment steps">
        <li className="es on"><span>1</span>Select your class</li>
        <li className="es on"><span>2</span>Compare plans</li>
        <li className="es"><span>3</span>Enroll &amp; pay</li>
      </ol>

      <div className="cls-switch">
        <span className="cls-switch-label">Step 1 — Choose your class</span>
        <div className="cls-switch-pick">
          {PLAN_CLASSES.map((c) => (
            <button key={c} className={"cls-switch-pill" + (cls === c ? " on" : "")} onClick={() => setCls(c)}>Class {c}</button>
          ))}
        </div>
      </div>

      <p className="step2-head">Step 2 — Compare Base, Rise &amp; Elite for <b>Class {cls}</b></p>

      <div className="plans">
        {PLANS.map((plan) => {
          const { price, gst, total } = priceBreakdown(plan.price);
          return (
            <div key={plan.id} className={"plan" + (plan.popular ? " popular" : "")} style={{ "--pa": plan.accent } as CSSProperties}>
              {plan.popular && <span className="crown">★ Most popular</span>}
              <div className="pname">{plan.name}</div>
              <div className="ptag">{plan.tagline}</div>
              <div className="pprice"><b>₹{price.toLocaleString("en-IN")}</b><span className="gst">+ GST</span></div>
              <div className="pbreak">₹{gst.toLocaleString("en-IN")} GST · ₹{total.toLocaleString("en-IN")} total · per year</div>
              <div className="pclass-tag">For Class {cls}</div>

              <ul>
                {ALL_FEATURES.map((f) => {
                  const has = plan.features.includes(f);
                  return (
                    <li key={f} className={has ? "has" : "no"}>
                      {has ? <CheckIcon size={17} /> : <Cross size={17} />}
                      <span>{f}</span>
                    </li>
                  );
                })}
              </ul>

              <button className={"btn block" + (plan.popular ? "" : " ghost")} disabled={busy === plan.id} onClick={() => choose(plan)} style={plan.popular ? { background: plan.accent, color: "#fff" } : undefined}>
                {busy === plan.id ? "Please wait…" : "Enroll Now"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="gst-note">All prices are per academic year and exclusive of 18% GST. {RAZORPAY_READY ? "Secure payment via Razorpay." : "Checkout runs in demo mode until Razorpay keys are configured."}</p>
    </>
  );
}
