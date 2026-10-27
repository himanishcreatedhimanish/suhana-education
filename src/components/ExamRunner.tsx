"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Test } from "@/lib/types";
import { getState, setState } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { toast } from "@/components/toast";

type Answer = number | number[] | string;

function fmt(s: number) {
  s = Math.max(0, s);
  const m = Math.floor(s / 60), ss = s % 60;
  return `${m < 10 ? "0" : ""}${m}:${ss < 10 ? "0" : ""}${ss}`;
}

export default function ExamRunner({ test }: { test: Test }) {
  const router = useRouter();
  const key = "suhana.exam." + test.id;
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [review, setReview] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState(test.duration_min * 60);
  const [confirming, setConfirming] = useState(false);
  const submitted = useRef(false);

  // resume in-progress attempt (connection-loss recovery)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && saved.remaining > 0) {
        setAnswers(saved.answers || {});
        setReview(saved.review || {});
        setCur(saved.cur || 0);
        setRemaining(saved.remaining);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // timer
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        const n = r - 1;
        if (n <= 0) { clearInterval(id); doSubmit(true); }
        return n;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // autosave
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify({ answers, review, cur, remaining })); } catch {}
  }, [answers, review, cur, remaining, key]);

  const q = test.questions[cur];
  const isAnswered = (qid: string) => {
    const a = answers[qid];
    if (a == null) return false;
    if (Array.isArray(a)) return a.length > 0;
    return String(a) !== "";
  };

  function select(i: number) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (q.type === "multi") {
        const arr = Array.isArray(next[q.id]) ? [...(next[q.id] as number[])] : [];
        const ix = arr.indexOf(i);
        if (ix > -1) arr.splice(ix, 1); else arr.push(i);
        if (arr.length) next[q.id] = arr; else delete next[q.id];
      } else {
        next[q.id] = i;
      }
      return next;
    });
  }

  function setNumeric(v: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (v.trim() === "") delete next[q.id]; else next[q.id] = v.trim();
      return next;
    });
  }

  async function doSubmit(auto = false) {
    if (submitted.current) return;
    submitted.current = true;
    setConfirming(false);
    try {
      const res = await fetch("/api/tests/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test.id, answers, timeUsedSec: test.duration_min * 60 - remaining }),
      });
      const data = await res.json();
      try { localStorage.removeItem(key); } catch {}
      if (!SUPABASE_CONFIGURED && data.result) {
        // store the computed result locally for the result page + dashboard
        const s = getState();
        s.attempts.push({ ...data.result, auto } as any);
        s.notifications.unshift({ body: `Test submitted: ${test.title} — scored ${data.result.score}/${data.result.max_score}`, at: Date.now() });
        setState(s);
      }
      if (data.id) router.push("/results/" + data.id);
      else toast(data.error || "Could not submit");
    } catch {
      submitted.current = false;
      toast("Submit failed — check your connection and retry.");
    }
  }

  const answeredCount = test.questions.filter((qq) => isAnswered(qq.id)).length;

  return (
    <div className="exam">
      <div className="exam-top">
        <div className="nm">{test.title}<small>{q.subject} · Question {cur + 1} of {test.questions.length}</small></div>
        <div className={"timer" + (remaining <= 60 ? " low" : "")}>{fmt(remaining)}</div>
      </div>

      <div className="exam-body">
        <div className="q-area">
          <div className="qh">
            <span className="qnum">Q{cur + 1}</span>
            <span className="badge">{q.subject}</span>
            <span className="q-marks">+{test.marks_correct} · {test.marks_wrong} · {q.type === "multi" ? "Multiple correct" : q.type === "numeric" ? "Numerical" : "Single correct"}</span>
          </div>
          <div className="q-text">{q.text}</div>

          {q.type === "numeric" ? (
            <input className="input num-in" inputMode="decimal" placeholder="Type your answer" value={(answers[q.id] as string) ?? ""} onChange={(e) => setNumeric(e.target.value)} />
          ) : (
            (q.options ?? []).map((o, i) => {
              const sel = q.type === "multi" ? Array.isArray(answers[q.id]) && (answers[q.id] as number[]).includes(i) : answers[q.id] === i;
              return (
                <div key={i} className={"opt" + (q.type === "multi" ? " multi" : "") + (sel ? " sel" : "")} onClick={() => select(i)}>
                  <span className="mk">{sel ? (q.type === "multi" ? "✓" : "") : String.fromCharCode(65 + i)}</span>
                  <span>{o}</span>
                </div>
              );
            })
          )}
        </div>

        <aside className="palette-wrap">
          <h4>Question palette</h4>
          <div className="palette">
            {test.questions.map((qq, i) => (
              <button key={qq.id} className={"pbtn" + (isAnswered(qq.id) ? " answered" : "") + (review[qq.id] ? " review" : "") + (i === cur ? " cur" : "")} onClick={() => setCur(i)}>{i + 1}</button>
            ))}
          </div>
          <div className="legend">
            <div className="lg"><span className="sw" style={{ background: "var(--ok)" }} />Answered ({answeredCount})</div>
            <div className="lg"><span className="sw" style={{ background: "var(--review)" }} />Marked for review</div>
            <div className="lg"><span className="sw" />Not visited</div>
          </div>
          <button className="btn danger block" style={{ marginTop: 18 }} onClick={() => setConfirming(true)}>Submit test</button>
        </aside>
      </div>

      <div className="exam-foot">
        <button className="btn ghost sm" onClick={() => setCur((c) => Math.max(0, c - 1))}>Previous</button>
        <button className="btn ghost sm" onClick={() => setAnswers((p) => { const n = { ...p }; delete n[q.id]; return n; })}>Clear response</button>
        <button className="btn ghost sm" onClick={() => setReview((p) => ({ ...p, [q.id]: !p[q.id] }))}>{review[q.id] ? "Unmark review" : "Mark for review"}</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setCur((c) => Math.min(test.questions.length - 1, c + 1))}>Save &amp; Next</button>
      </div>

      {confirming && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setConfirming(false); }}>
          <div className="modal">
            <h3 style={{ marginBottom: 12 }}>Submit test?</h3>
            <div className="kv"><span>Answered</span><b>{answeredCount} / {test.questions.length}</b></div>
            <div className="kv"><span>Not answered</span><b>{test.questions.length - answeredCount}</b></div>
            <div className="kv"><span>Time left</span><b>{fmt(remaining)}</b></div>
            <p className="mut" style={{ fontSize: ".86rem", margin: "14px 0" }}>Once submitted, your answers are scored and locked.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn ghost block" onClick={() => setConfirming(false)}>Keep attempting</button>
              <button className="btn block" onClick={() => doSubmit(false)}>Submit now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
