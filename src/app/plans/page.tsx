import Link from "next/link";
import PlanCards from "@/components/PlanCards";
import { LiveIcon, BookIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Plans & Pricing — Suhana Education",
  description: "Base, Rise and Elite plans with complete learning support for Class 8, 9 & 10.",
};

export default function PlansPage({ searchParams }: { searchParams: { class?: string } }) {
  const c = Number(searchParams.class);
  const initialClass = [8, 9, 10].includes(c) ? c : 9;
  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/">Home</Link> › Plans &amp; pricing</div>
      <div className="sec-head" style={{ marginTop: 6 }}>
        <span className="eyebrow">Plans &amp; pricing</span>
        <h2>Choose your subscription — Base, Rise or Elite.</h2>
        <p>One annual subscription covers everything for your class. Select your class, compare what each plan includes, and enrol securely. Looking for lessons instead? <Link href="/courses" style={{ color: "var(--primary)", fontWeight: 600 }}>Explore courses →</Link></p>
      </div>

      <PlanCards initialClass={initialClass} />

      <div className="card" style={{ marginTop: 40, maxWidth: 820, margin: "40px auto 0" }}>
        <h3 style={{ marginBottom: 10 }}>What’s included</h3>
        <div className="mut" style={{ fontSize: ".92rem", display: "grid", gap: 8 }}>
          <div><b style={{ color: "var(--ink)" }}>Live &amp; recorded lectures</b> — learn from expert teachers in interactive live classes, and revisit recordings anytime (Rise &amp; Elite).</div>
          <div><b style={{ color: "var(--ink)" }}>Study material</b> — chapter-wise notes and practice material, delivered as soft copy (Base &amp; Rise) or printed hard copy (Elite).</div>
          <div><b style={{ color: "var(--ink)" }}>DPPs, assignments &amp; exams</b> — daily practice problems, regular assignments and fortnightly online exams to track progress.</div>
          <div><b style={{ color: "var(--ink)" }}>Online doubt solving</b> — get your doubts resolved by subject experts.</div>
          <div><b style={{ color: "var(--ink)" }}>Health Gennie</b> — health consultations by doctors and counsellors, in association with our health partner (Rise &amp; Elite).</div>
          <div><b style={{ color: "var(--ink)" }}>Psychoanalysis (DPIT)</b> — psychometric assessments to understand your aptitude and explore suitable career paths (Rise &amp; Elite).</div>
        </div>
      </div>

      <div className="notice" style={{ marginTop: 24, maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
        <LiveIcon size={18} />
        <div>
          <b>Free for eligible students.</b> The programme is completely free for underprivileged students — orphans, destitute children, students from economically weaker sections and wards of police martyrs.{" "}
          <Link href="/about" style={{ color: "var(--primary)", fontWeight: 600 }}>Read about eligibility →</Link>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link className="btn ghost" href="/courses"><BookIcon size={16} /> Explore course content</Link>
      </div>
    </div>
  );
}
