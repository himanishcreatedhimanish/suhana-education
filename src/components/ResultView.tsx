"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AttemptResult } from "@/lib/types";
import { getState } from "@/lib/clientState";

function fmt(s: number) { const m = Math.floor(s / 60), ss = s % 60; return `${m}m ${ss}s`; }

export default function ResultView({ attempt, id }: { attempt: AttemptResult | null; id: string }) {
  const [a, setA] = useState<AttemptResult | null>(attempt);

  useEffect(() => {
    if (!a) {
      const found = getState().attempts.find((x) => x.id === id) || null;
      setA(found);
    }
  }, [a, id]);

  if (!a) {
    return (
      <div className="wrap page"><div className="card">Result not found. <Link href="/tests" style={{ color: "var(--primary)" }}>Back to tests</Link></div></div>
    );
  }

  const attempted = a.correct + a.wrong;
  const acc = attempted ? Math.round((a.correct / attempted) * 100) : 0;
  const pct = a.max_score ? Math.max(0, Math.round((a.score / a.max_score) * 100)) : 0;
  const circ = 2 * Math.PI * 54;
  const off = circ * (1 - Math.max(0, pct) / 100);

  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/tests">Test series</Link> › Result</div>
      <div className="res-hero">
        <svg className="res-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="10" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 60 60)" />
          <text x="60" y="56" textAnchor="middle" fontFamily="Bricolage Grotesque,sans-serif" fontWeight="800" fontSize="24" fill="#fff">{pct}%</text>
          <text x="60" y="74" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.75)">SCORE</text>
        </svg>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>Test completed</div>
          <div className="big">{a.score} / {a.max_score} marks</div>
          <p className="sub">{a.title} · {fmt(a.time_used_sec)} taken</p>
        </div>
      </div>

      <div className="res-stats">
        <div className="res-stat"><div className="n" style={{ color: "var(--ok)" }}>{a.correct}</div><div className="mut">Correct</div></div>
        <div className="res-stat"><div className="n" style={{ color: "var(--bad)" }}>{a.wrong}</div><div className="mut">Wrong</div></div>
        <div className="res-stat"><div className="n">{a.unattempted}</div><div className="mut">Unattempted</div></div>
        <div className="res-stat"><div className="n">{acc}%</div><div className="mut">Accuracy</div></div>
      </div>

      <h3 style={{ margin: "10px 0 14px" }}>Subject-wise analysis</h3>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Subject</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Accuracy</th></tr></thead>
          <tbody>
            {Object.entries(a.by_subject).map(([s, b]) => {
              const at = b.c + b.w; const ac = at ? Math.round((b.c / at) * 100) : 0;
              return <tr key={s}><td><b>{s}</b></td><td>{b.c}</td><td>{b.w}</td><td>{b.u}</td><td>{ac}%</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
        <Link className="btn" href={`/tests/${a.test_id}`}>Re-attempt</Link>
        <Link className="btn ghost" href="/tests">Back to tests</Link>
        <Link className="btn ghost" href="/dashboard">Go to dashboard</Link>
      </div>
    </div>
  );
}
