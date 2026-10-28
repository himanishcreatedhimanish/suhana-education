import type { CSSProperties } from "react";
import Link from "next/link";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { CheckIcon } from "@/components/icons";
import { PLANS, priceBreakdown } from "@/lib/plans";
import HeroVisual from "@/components/HeroVisual";

export default async function HomePage() {
  const steps = [
    { t: "Create your free account", d: "Sign up with your phone, email or Google in under a minute — no card needed.", c: "#4338ca", c2: "#6d28d9", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></> },
    { t: "Pick your class & subjects", d: "Choose Class 8, 9 or 10 and your JKBOSE subjects — Mathematics, Science, Social Science and English.", c: "#ef8a1f", c2: "#d2691e", icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></> },
    { t: "Learn, practise & track", d: "Join live classes, watch recordings, attempt tests, and follow your progress on your dashboard.", c: "#15935a", c2: "#0e7a4a", icon: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></> },
  ];

  const feats = [
    ["Live classes", "Interactive live sessions with teachers, plus weekly doubt-solving."],
    ["Recorded lectures", "Full recorded libraries you can watch anytime, at your own pace."],
    ["Test series & mocks", "Chapter-wise and full-length mocks with instant scoring and analysis."],
    ["Progress tracking", "Lecture completion and test performance on your dashboard."],
    ["Expert teachers", "Learn from experienced J&K State Board (JKBOSE) faculty."],
    ["Structured by syllabus", "Organised by class, exam, subject, chapter and lecture."],
  ];

  return (
    <>
      {!SUPABASE_CONFIGURED && (
        <div className="wrap" style={{ paddingTop: 16 }}>
          <div className="notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
            <div><b>Demo mode.</b> Supabase is not configured, so data is local sample content and auth/payments are simulated. Add your keys in <code>.env.local</code> to enable real accounts, database and Razorpay.</div>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <span className="tagpill"><b>NEW</b> JKBOSE 2026–27 live batches</span>
            <h1>Ace the <span className="grad">J&K State Board</span> — Class 8, 9 &amp; 10.</h1>
            <p className="lead">Live classes, recorded lectures and test series for JKBOSE Classes 8–10 — organised by class, subject and chapter, with progress tracking built in.</p>
            <div className="cta">
              <Link className="btn" href="/courses">Explore courses</Link>
              <Link className="btn ghost" href="/tests">Try a mock test</Link>
            </div>
          </div>
          <div className="visual">
            <HeroVisual />
          </div>
        </div>
      </section>

      <section className="sec sec-soft">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">How it works</span><h2>Start learning in three simple steps.</h2><p>From sign-up to your first lesson in minutes — no complicated setup.</p></div>
          <div className="steps">
            {steps.map((s, i) => (
              <div key={s.t} className="step">
                <span className="step-n">{i + 1}</span>
                <div className="step-ic" style={{ background: `linear-gradient(135deg, ${s.c}, ${s.c2})` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={24} height={24}>{s.icon}</svg>
                </div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 34 }}><Link className="btn" href="/login">Create your free account</Link></div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Why Suhana</span><h2>Everything prep needs, in one place.</h2></div>
          <div className="tiles">
            {feats.map((f) => (
              <div key={f[0]} className="card feat-c">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={23} height={23}><path d="M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></svg></div>
                <h3>{f[0]}</h3><p>{f[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec-soft">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">Plans &amp; pricing</span><h2>Complete learning support for Class 8, 9 &amp; 10.</h2><p>Base, Rise and Elite plans — live classes, study material, doubt-solving, exams, plus health and career support on higher tiers.</p></div>
          <div className="plans">
            {PLANS.map((plan) => {
              const { price } = priceBreakdown(plan.price);
              return (
                <div key={plan.id} className={"plan" + (plan.popular ? " popular" : "")} style={{ "--pa": plan.accent } as CSSProperties}>
                  {plan.popular && <span className="crown">★ Most popular</span>}
                  <div className="pname">{plan.name}</div>
                  <div className="ptag">{plan.tagline}</div>
                  <div className="pprice"><b>₹{price.toLocaleString("en-IN")}</b><span className="gst">+ GST</span></div>
                  <ul>
                    {plan.features.slice(0, 5).map((f) => (
                      <li key={f} className="has"><CheckIcon size={17} /><span>{f}</span></li>
                    ))}
                    {plan.features.length > 5 && <li className="has" style={{ color: "var(--muted)" }}><span style={{ marginLeft: 27 }}>+ {plan.features.length - 5} more</span></li>}
                  </ul>
                  <Link className={"btn block" + (plan.popular ? "" : " ghost")} href="/plans" style={plan.popular ? { background: plan.accent, color: "#fff" } : undefined}>Choose {plan.name.replace(" Plan", "")}</Link>
                </div>
              );
            })}
          </div>
          <p className="gst-note">All prices per academic year, exclusive of 18% GST. <Link href="/plans" style={{ color: "var(--primary)", fontWeight: 600 }}>Compare all features →</Link></p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="card" style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)" }}>Ready to start preparing?</h2>
            <p className="mut" style={{ margin: "12px 0 22px" }}>Create a free account, pick your class and exam, and begin with live or recorded lessons.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn" href="/login">Create free account</Link>
              <Link className="btn ghost" href="/courses">Browse courses</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
