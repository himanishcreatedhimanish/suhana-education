import Link from "next/link";
import PlanCards from "@/components/PlanCards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Plans and pricing — Suhana Education",
  description: "Base, Rise and Elite plans for JKBOSE Class 8, 9 and 10: live classes, study material, doubt solving and fortnightly exams.",
};

const EXPLAIN: [string, string][] = [
  ["Live and recorded lectures", "Learn from your teachers in scheduled live classes. Rise and Elite add recordings you can rewatch at any time."],
  ["Study material", "Chapter-wise notes and practice material as a soft copy on every plan. Elite adds the printed books, delivered home."],
  ["DPPs, assignments and exams", "Daily practice problems, regular assignments and a fortnightly online exam so progress is measured, not guessed."],
  ["Online doubt solving", "Ask subject teachers when something doesn’t make sense, and get it resolved online."],
  ["Health Gennie", "Health consultations with doctors and counsellors, through our health partner (Rise and Elite)."],
  ["Psychoanalysis (DPIT)", "A psychometric assessment that helps students understand their aptitude and explore careers (Rise and Elite)."],
];

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const c = Number((await searchParams).class);
  const initialClass = [8, 9, 10].includes(c) ? c : 9;
  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span className="sep" aria-hidden />Plans and pricing</nav>
      <div className="page-head">
        <div>
          <h1>Plans and pricing</h1>
          <p>One yearly subscription covers every subject in your class. Choose your class, compare the three plans, and enroll securely.</p>
        </div>
        <Link className="btn ghost" href="/courses">Explore course content</Link>
      </div>

      <PlanCards initialClass={initialClass} />

      <section className="compare" aria-labelledby="explain-h">
        <h2 id="explain-h">What each feature means</h2>
        <div className="explain">
          {EXPLAIN.map(([t, d]) => <div key={t}><b>{t}</b><p>{d}</p></div>)}
        </div>
      </section>

      <div className="free-note lattice">
        <div>
          <b>Free for eligible students.</b>
          <p>The programme is completely free for orphans, destitute children, students from economically weaker sections and wards of police martyrs.</p>
        </div>
        <Link className="btn outline-night" href="/about#free">Check eligibility</Link>
      </div>
    </div>
  );
}
