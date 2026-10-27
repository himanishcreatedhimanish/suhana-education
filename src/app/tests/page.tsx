import Link from "next/link";
import { getTests } from "@/lib/data";
import { ClockIcon, BookIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const tests = await getTests();
  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/">Home</Link> › Test series</div>
      <div className="page-head">
        <div>
          <h1>Test series &amp; mock tests</h1>
          <p>Attempt full-length and chapter tests with a real exam interface, timer and instant analysis.</p>
        </div>
      </div>
      <div className="grid">
        {tests.map((t) => (
          <article className="card" key={t.id}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <span className="badge">{t.exam}</span>
              <span className="badge accent">Class {t.class}</span>
            </div>
            <h3 style={{ fontSize: "1.15rem" }}>{t.title}</h3>
            <div className="pmeta" style={{ margin: "12px 0" }}>
              <span className="d"><ClockIcon size={14} />{t.duration_min} min</span>
              <span className="d"><BookIcon size={14} />{t.marks_correct} / {t.marks_wrong} marking</span>
            </div>
            <Link className="btn sm" href={`/tests/${t.id}`}>Start test</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
