"use client";
import { useState } from "react";
import { PLANS, PLAN_CLASSES, ALL_FEATURES, priceBreakdown, type Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";
import { getState, setState } from "@/lib/clientState";
import { SUPABASE_CONFIGURED, RAZORPAY_PUBLIC_KEY } from "@/lib/env";
import { toast } from "@/components/toast";
import { CheckIcon } from "@/components/icons";
import CheckoutSheet from "@/components/CheckoutSheet";

const RAZORPAY_READY = Boolean(RAZORPAY_PUBLIC_KEY) && SUPABASE_CONFIGURED;

declare global { interface Window { Razorpay?: any } }

// Plain-language notes for the comparison table.
const FEATURE_NOTE: Record<string, string> = {
  "Live Lectures": "Scheduled classes with your teachers",
  "Recorded Lectures": "Rewatch lessons any time",
  "Soft Copy of Study Material": "Chapter-wise notes to download",
  "Hard Copy of Study Material": "Printed books delivered home",
  "DPPs (Daily Practice Problems)": "A short set after each lesson",
  "Assignments": "Regular written work",
  "Online Doubt Solving": "Ask subject teachers online",
  "Fortnightly Online Exams": "Timed, scored instantly",
  "Health Gennie (health consultations)": "Doctors and counsellors",
  "Psychoanalysis (DPIT)": "Psychometric career assessment",
};

export default function PlanCards({ initialClass = 9 }: { initialClass?: number }) {
  const [cls, setCls] = useState<number>(initialClass);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<{ plan: Plan; cls: number } | null>(null);

  function loadRazorpay(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(); s.onerror = () => reject(new Error("Couldn’t load Razorpay. Check your connection and try again."));
      document.body.appendChild(s);
    });
  }

  // Step 1: make sure the student is signed in (live mode), then show the order summary.
  async function choose(plan: Plan) {
    const selectedClass = cls;
    if (SUPABASE_CONFIGURED) {
      setBusy(plan.id);
      const supabase = createClient()!;
      const { data: { user } } = await supabase.auth.getUser();
      setBusy(null);
      if (!user) { window.location.href = "/login?next=/plans"; return; }
    }
    setPending({ plan, cls: selectedClass });
  }

  // Step 2: pay (live) or activate (demo).
  async function pay() {
    if (!pending) return;
    const { plan, cls: selectedClass } = pending;

    if (!RAZORPAY_READY) {
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
      if (!order.id) throw new Error(order.error || "Couldn’t start the payment. Try again.");
      await loadRazorpay();
      setPending(null);
      const rzp = new window.Razorpay({
        key: RAZORPAY_PUBLIC_KEY, order_id: order.id, amount: order.amount, currency: "INR",
        name: "Suhana Education", description: `${plan.name} · Class ${selectedClass}`,
        theme: { color: "#1f4fe0" },
        handler: async (resp: any) => {
          const vr = await fetch("/api/payments/verify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...resp, planId: plan.id, class: selectedClass }),
          });
          const v = await vr.json();
          if (v.ok) { toast(`${plan.name} activated for Class ${selectedClass}`); window.location.href = "/dashboard"; }
          else toast("We couldn’t verify this payment. If money was deducted, it will be confirmed shortly.");
        },
      });
      rzp.open();
    } catch (e: any) { toast(e.message || "Payment didn’t go through. Try again."); }
    finally { setBusy(null); }
  }

  function grantDemo(plan: Plan, selectedClass: number) {
    const s = getState();
    s.subscription = { planId: plan.id, planName: plan.name, class: selectedClass, at: Date.now() };
    s.notifications.unshift({ body: `${plan.name} activated for Class ${selectedClass}`, at: Date.now() });
    setState(s);
    toast(`${plan.name} activated for Class ${selectedClass}`);
    window.location.href = "/dashboard";
  }

  const featured = PLANS.findIndex((p) => p.popular);

  return (
    <>
      <div className="plans-head">
        <p className="lbl">Showing prices for <b>Class {cls}</b>. The same plans cover every subject in your class.</p>
        <div className="seg" role="group" aria-label="Choose your class">
          {PLAN_CLASSES.map((c) => (
            <button key={c} type="button" aria-pressed={cls === c} onClick={() => setCls(c)}>Class {c}</button>
          ))}
        </div>
      </div>

      <div className="plan-cols">
        {PLANS.map((plan) => {
          const { price, gst, total } = priceBreakdown(plan.price);
          return (
            <div key={plan.id} className={"plan-col" + (plan.popular ? " feature" : "")}>
              <div className="pc-top">
                <h3>{plan.name}</h3>
                {plan.popular && <span className="pc-flag">Most popular</span>}
              </div>
              <p className="pc-tag">{plan.tagline}</p>
              <div>
                <div className="pc-price"><b>₹{price.toLocaleString("en-IN")}</b><span>a year</span></div>
                <div className="pc-gst" style={{ marginTop: 8 }}>+ ₹{gst.toLocaleString("en-IN")} GST, ₹{total.toLocaleString("en-IN")} in total</div>
              </div>
              <ul className="pc-list">
                {plan.features.map((f) => <li key={f}><CheckIcon size={17} /><span>{f}</span></li>)}
              </ul>
              <button className={"btn lg block" + (plan.popular ? " light" : "")} disabled={busy === plan.id} onClick={() => choose(plan)}>
                {busy === plan.id ? "Please wait…" : `Enroll in ${plan.name.replace(" Plan", "")}`}
              </button>
            </div>
          );
        })}
      </div>
      <p className="plan-note">
        Prices are per academic year and exclude 18% GST.{" "}
        {RAZORPAY_READY ? "Payments are processed securely by Razorpay." : "Checkout is simulated until Razorpay keys are configured."}
      </p>

      <section className="compare" aria-labelledby="cmp-h">
        <h2 id="cmp-h">Compare every feature</h2>
        <div className="cmp-wrap">
          <table className="cmp">
            <colgroup>
              <col />
              {PLANS.map((p, i) => <col key={p.id} className={i === featured ? "feat-col" : undefined} />)}
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                {PLANS.map((p) => <th key={p.id} scope="col" className="c">{p.name.replace(" Plan", "")}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Price per year<small>Before 18% GST</small></th>
                {PLANS.map((p) => <td key={p.id} className="c" style={{ fontWeight: 650 }}>₹{p.price.toLocaleString("en-IN")}</td>)}
              </tr>
              {ALL_FEATURES.map((f) => (
                <tr key={f}>
                  <th scope="row">{f}{FEATURE_NOTE[f] && <small>{FEATURE_NOTE[f]}</small>}</th>
                  {PLANS.map((p) => (
                    <td key={p.id} className="c">
                      {p.features.includes(f)
                        ? <span className="yes"><CheckIcon size={18} /><span className="sr-only">Included</span></span>
                        : <><span className="no" aria-hidden /><span className="sr-only">Not included</span></>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pending && (() => {
        const { gst, total } = priceBreakdown(pending.plan.price);
        return (
          <CheckoutSheet
            itemTitle={pending.plan.name}
            itemSub={`Class ${pending.cls}, one academic year`}
            cover={<span aria-hidden style={{ width: 52, height: 52, borderRadius: 10, display: "grid", placeItems: "center", flex: "none", fontWeight: 700, fontSize: "1.25rem", background: "var(--night)", color: "#fff" }}>{pending.plan.name.slice(0, 1)}</span>}
            lines={[["Plan price", "₹" + pending.plan.price.toLocaleString("en-IN")], ["GST (18%)", "₹" + gst.toLocaleString("en-IN")]]}
            total={total}
            live={RAZORPAY_READY}
            busy={busy === pending.plan.id}
            onPay={pay}
            onClose={() => setPending(null)}
          />
        );
      })()}
    </>
  );
}
