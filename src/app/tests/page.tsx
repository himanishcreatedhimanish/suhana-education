import Link from "next/link";
import { getTests } from "@/lib/data";
import { ClockIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Test series — Suhana Education",
  description: "Timed JKBOSE mock tests for Classes 8, 9 and 10 with instant scoring and subject-wise analysis.",
};

export default async function TestsPage() {
  const tests = await getTests();
  const classes = [...new Set(tests.map((t) => t.class))].sort((a, b) => a - b);
  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span className="sep" aria-hidden />Test series</nav>
      <div className="page-head">
        <div>
          <h1>Test series</h1>
          <p>Timed chapter and full-length tests in the board exam format. You get your score, accuracy and a subject-wise breakdown the moment you submit.</p>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="empty"><h3>No tests published yet</h3><p>Tests appear here as soon as teachers publish them.</p></div>
      ) : (
        classes.map((c) => (
          <section key={c} className="cx-sec" aria-labelledby={`tests-${c}`}>
            <div className="cx-sec-h"><h2 id={`tests-${c}`}>Class {c}</h2></div>
            <div className="test-list">
              {tests.filter((t) => t.class === c).map((t) => (
                <div className="test-row" key={t.id}>
                  <div className="tr-main">
                    <h3>{t.title}</h3>
                    <div className="meta">
                      <span><ClockIcon size={14} />{t.duration_min} min</span>
                      <span>+{t.marks_correct} for a correct answer, {t.marks_wrong} for a wrong one</span>
                      <span>{t.exam}</span>
                    </div>
                  </div>
                  <Link className="btn sm" href={`/tests/${t.id}`}>Start test</Link>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
