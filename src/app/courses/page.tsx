import Link from "next/link";
import PlanCards from "@/components/PlanCards";
import { BookIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Enroll — Suhana Education",
  description: "Select your class and choose a Base, Rise or Elite plan for JKBOSE Classes 8–10.",
};

export default function CoursesPage({ searchParams }: { searchParams: { class?: string } }) {
  const c = Number(searchParams.class);
  const initialClass = [8, 9, 10].includes(c) ? c : 9;
  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/">Home</Link> › Enroll</div>
      <div className="sec-head" style={{ marginTop: 6 }}>
        <span className="eyebrow">Enroll</span>
        <h2>Join Suhana — pick your class &amp; plan.</h2>
        <p>Everything for J&amp;K State Board (JKBOSE) Classes 8–10 is bundled into three simple plans. Choose your class, compare plans, and enroll in minutes.</p>
      </div>

      <PlanCards initialClass={initialClass} />

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link className="btn ghost" href="/tests"><BookIcon size={16} /> Try a free mock test</Link>
      </div>
    </div>
  );
}
