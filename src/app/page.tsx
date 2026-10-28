import type { CSSProperties } from "react";
import Link from "next/link";
import { getCourses } from "@/lib/data";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import CourseCard from "@/components/CourseCard";
import { CheckIcon } from "@/components/icons";
import { PLANS, priceBreakdown } from "@/lib/plans";
import HeroVisual from "@/components/HeroVisual";

export default async function HomePage() {
  const courses = await getCourses();
  const popular = courses.slice(0, 3);

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
          <div className="sec-head"><span className="eyebrow">Popular courses</span><h2>Start with a top batch.</h2></div>
          <div className="grid">{popular.map((c) => <CourseCard key={c.id} course={c} />)}</div>
          <div style={{ textAlign: "center", marginTop: 28 }}><Link className="btn ghost" href="/courses">View all courses</Link></div>
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
