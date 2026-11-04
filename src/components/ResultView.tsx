"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AttemptResult } from "@/lib/types";
import { getState } from "@/lib/clientState";

function fmt(s: number) { const m = Math.floor(s / 60), ss = s % 60; return m ? `${m} min ${ss} s` : `${ss} s`; }

export default function ResultView({ attempt, id }: { attempt: AttemptResult | null; id: string }) {
  const [a, setA] = useState<AttemptResult | null>(attempt);
  const [checked, setChecked] = useState(!!attempt);

  useEffect(() => {
    if (!a) {
      const found = getState().attempts.find((x) => x.id === id) || null;
      setA(found);
      setChecked(true);
    }
  }, [a, id]);

  if (!a) {
    if (!checked) return <div className="wrap page" aria-busy="true"><p className="mut">Loading result…</p></div>;
    return (
      <div className="wrap page">
        <div className="empty" style={{ maxWidth: 560, margin: "40px auto 0" }}>
          <h2 style={{ fontSize: "1.5rem" }}>We couldn’t find this result</h2>
          <p style={{ marginTop: 10 }}>It may belong to another account or browser. Your attempts are listed under Mock tests on your dashboard.</p>
          <Link className="btn" href="/tests">Go to test series</Link>
        </div>
      </div>
    );
  }

  const attempted = a.correct + a.wrong;
  const acc = attempted ? Math.round((a.correct / attempted) * 100) : 0;
  const pct = a.max_score ? Math.max(0, Math.round((a.score / a.max_score) * 100)) : 0;
  const circ = 2 * Math.PI * 52;
  const off = circ * (1 - Math.max(0, pct) / 100);

  return (
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/tests">Test series</Link><span className="sep" aria-hidden />Result</nav>
      <div className="res-hero lattice">
        <svg className="res-ring" viewBox="0 0 120 120" role="img" aria-label={`Score ${pct} percent`}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="9" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="#f5b83d" strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 60 60)" />
          <text x="60" y="66" textAnchor="middle" fontFamily="inherit" fontWeight="720" fontSize="26" fill="#fff" letterSpacing="-1">{pct}%</text>
        </svg>
        <div>
          <span className="eyebrow">Test submitted</span>
          <div className="big">{a.score} out of {a.max_score} marks</div>
          <p className="sub">{a.title}. Time taken: {fmt(a.time_used_sec)}.</p>
        </div>
      </div>

      <div className="res-stats">
        <div className="res-stat"><div className="n" style={{ color: "var(--ok)" }}>{a.correct}</div><div className="mut">Correct</div></div>
        <div className="res-stat"><div className="n" style={{ color: "var(--live)" }}>{a.wrong}</div><div className="mut">Wrong</div></div>
        <div className="res-stat"><div className="n">{a.unattempted}</div><div className="mut">Not attempted</div></div>
        <div className="res-stat"><div className="n">{acc}%</div><div className="mut">Accuracy</div></div>
      </div>

      <h2 style={{ fontSize: "1.25rem", marginBottom: 14 }}>By subject</h2>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Subject</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Accuracy</th></tr></thead>
          <tbody>
            {Object.entries(a.by_subject).map(([s, b]) => {
              const at = b.c + b.w; const ac = at ? Math.round((b.c / at) * 100) : 0;
              return <tr key={s}><td><b style={{ fontWeight: 600 }}>{s}</b></td><td className="tnum">{b.c}</td><td className="tnum">{b.w}</td><td className="tnum">{b.u}</td><td className="tnum">{ac}%</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
        <Link className="btn" href={`/tests/${a.test_id}`}>Retake this test</Link>
        <Link className="btn ghost" href="/dashboard">Go to dashboard</Link>
        <Link className="btn quiet" href="/tests">All tests</Link>
      </div>
    </div>
  );
}
