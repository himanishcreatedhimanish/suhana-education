"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getState, setState } from "@/lib/clientState";
import { toast } from "@/components/toast";
import { RAZORPAY_PUBLIC_KEY, SUPABASE_CONFIGURED } from "@/lib/env";

// On the client we can only see NEXT_PUBLIC_* vars, so gate real checkout on
// the public Razorpay key (plus Supabase for the server order + verification).
const RAZORPAY_READY = Boolean(RAZORPAY_PUBLIC_KEY) && SUPABASE_CONFIGURED;
import { PlayIcon, LiveIcon, CheckIcon, BookIcon, ClockIcon, InfoIcon } from "@/components/icons";

function rupee(n: number) { return n > 0 ? "₹" + n.toLocaleString("en-IN") : "Free"; }

declare global { interface Window { Razorpay?: any } }

export default function CourseDetail({
  course,
  userId,
  initialEnrolled,
  initialProgress,
}: {
  course: Course;
  userId: string | null;
  initialEnrolled: boolean;
  initialProgress: string[];
}) {
  const [tab, setTab] = useState<"chapters" | "overview" | "schedule" | "teacher">("chapters");
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [done, setDone] = useState<Set<string>>(new Set(initialProgress));
  const [busy, setBusy] = useState(false);

  // demo mode: hydrate from localStorage
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      const s = getState();
      setEnrolled(s.enrolled.includes(course.id));
      const d = new Set<string>();
      course.chapters.forEach((ch) => ch.lectures.forEach((l) => { if (s.progress[course.id + "/" + l.id]) d.add(l.id); }));
      setDone(d);
    }
  }, [course]);

  const total = course.chapters.reduce((s, c) => s + c.lectures.length, 0);
  const pct = total ? Math.round((done.size / total) * 100) : 0;

  async function enroll() {
    if (course.price > 0) return payAndEnroll();
    await grantAccess();
  }

  async function grantAccess() {
    setBusy(true);
    if (SUPABASE_CONFIGURED) {
      const supabase = createClient()!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login?next=/courses/" + course.id; return; }
      await supabase.from("enrollments").insert({ user_id: user.id, course_id: course.id });
    } else {
      const s = getState();
      if (!s.enrolled.includes(course.id)) { s.enrolled.push(course.id); s.notifications.unshift({ body: "Enrolled in " + course.title, at: Date.now() }); setState(s); }
    }
    setEnrolled(true); setBusy(false); toast("Enrolled in " + course.title);
  }

  async function payAndEnroll() {
    if (!userId && SUPABASE_CONFIGURED) { window.location.href = "/login?next=/courses/" + course.id; return; }
    if (!RAZORPAY_READY) {
      // Demo checkout — no real charge.
      if (!confirm(`Demo payment of ${rupee(course.price)} for "${course.title}". No real charge is made. Continue?`)) return;
      await grantAccess();
      return;
    }
    setBusy(true);
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const order = await orderRes.json();
      if (!order.id) throw new Error(order.error || "Could not create order");
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: RAZORPAY_PUBLIC_KEY, order_id: order.id, amount: order.amount, currency: "INR",
        name: "Suhana Education", description: course.title,
        handler: async (resp: any) => {
          const vr = await fetch("/api/payments/verify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...resp, courseId: course.id }),
          });
          const v = await vr.json();
          if (v.ok) { setEnrolled(true); toast("Payment verified — you're enrolled!"); }
          else toast("Payment could not be verified.");
        },
      });
      rzp.open();
    } catch (e: any) { toast(e.message || "Payment failed"); }
    finally { setBusy(false); }
  }

  function loadRazorpay(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(); s.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(s);
    });
  }

  async function toggleProgress(lectureId: string) {
    const next = new Set(done);
    const isDone = next.has(lectureId);
    if (isDone) next.delete(lectureId); else next.add(lectureId);
    setDone(next);
    if (SUPABASE_CONFIGURED) {
      const supabase = createClient()!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (isDone) await supabase.from("lecture_progress").delete().match({ user_id: user.id, lecture_id: lectureId });
      else await supabase.from("lecture_progress").upsert({ user_id: user.id, lecture_id: lectureId, completed: true });
    } else {
      const s = getState(); const k = course.id + "/" + lectureId;
      if (isDone) delete s.progress[k]; else s.progress[k] = true; setState(s);
    }
  }

  const tabs: [typeof tab, string][] = [["chapters", "Chapters & lectures"], ["overview", "Overview"], ["schedule", "Live schedule"], ["teacher", "Teachers"]];

  return (
    <div className="wrap page">
      <div className="crumbs"><Link href="/">Home</Link> › <Link href="/courses">Courses</Link> › {course.title}</div>
      <div className="page-head">
        <div>
          <div className="ptags" style={{ marginBottom: 10 }}>
            <span className="t">Class {course.class}</span><span className="t">{course.exam}</span><span className="t">{course.subject}</span><span className="t">{course.type}</span>
          </div>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>
      </div>

      <div className="detail">
        <div>
          <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--line)", marginBottom: 20, overflowX: "auto" }}>
            {tabs.map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                font: "inherit", fontWeight: 600, fontSize: ".92rem", color: tab === t ? "var(--primary)" : "var(--muted)",
                background: "none", border: 0, padding: "12px 4px", marginRight: 18, cursor: "pointer",
                borderBottom: "2.5px solid " + (tab === t ? "var(--primary)" : "transparent"), whiteSpace: "nowrap",
              }}>{label}</button>
            ))}
          </div>

          {tab === "chapters" && (
            <>
              {!enrolled && (
                <div className="notice" style={{ marginBottom: 16 }}><InfoIcon size={18} /><div>Enroll to unlock all lectures and track progress. Preview the structure below.</div></div>
              )}
              {course.chapters.map((ch, i) => (
                <details key={ch.id} className="chapter" open={i === 0}>
                  <summary>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                    {ch.title}<span className="cx">{ch.lectures.length} lectures</span>
                  </summary>
                  {ch.lectures.map((l) => {
                    const isDone = done.has(l.id);
                    return (
                      <div className="lecture" key={l.id}>
                        <div className={"lic" + (isDone ? " done" : "")}>{l.type === "live" ? <LiveIcon size={16} /> : isDone ? <CheckIcon size={16} /> : <PlayIcon size={16} />}</div>
                        <div><div className="lt">{l.title}</div><div className="ls">{l.description} · {l.duration_min} min</div></div>
                        <div className="lr">
                          {enrolled ? (
                            l.type === "live" ? <span className="badge live">Live</span>
                              : <button className="mini-btn" onClick={() => toggleProgress(l.id)}>{isDone ? "✓ Done" : "Mark done"}</button>
                          ) : <span className="badge">Locked</span>}
                        </div>
                      </div>
                    );
                  })}
                </details>
              ))}
            </>
          )}

          {tab === "overview" && (
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>About this course</h3>
              <p className="mut">{course.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 18 }}>
                {[["Exam", course.exam], ["Class", course.class], ["Subject", course.subject], ["Type", course.type], ["Lectures", total], ["Chapters", course.chapters.length]].map(([k, v]) => (
                  <div key={String(k)} className="kv" style={{ borderTop: 0 }}><span>{k}</span><b>{v}</b></div>
                ))}
              </div>
            </div>
          )}

          {tab === "schedule" && (
            <div className="card">
              {course.chapters.flatMap((ch) => ch.lectures).filter((l) => l.type === "live" && l.scheduled_at).length ? (
                course.chapters.flatMap((ch) => ch.lectures).filter((l) => l.type === "live" && l.scheduled_at).map((l) => (
                  <div className="lecture" key={l.id} style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <div className="lic"><LiveIcon size={16} /></div>
                    <div><div className="lt">{l.title}</div><div className="ls">{new Date(l.scheduled_at!).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div></div>
                    <div className="lr"><span className="badge live">Live</span></div>
                  </div>
                ))
              ) : <p className="mut">No live classes scheduled yet. Recorded lectures are in the Chapters tab.</p>}
            </div>
          )}

          {tab === "teacher" && (
            <div className="card">
              <div className="notice" style={{ marginBottom: 16 }}><InfoIcon size={18} /><div>Teacher names are editable in the Admin console under Courses.</div></div>
              <div className="teacher"><span className="av" /><div><div style={{ fontWeight: 700 }}>{course.teacher_name}</div><div className="mut" style={{ fontSize: ".82rem" }}>{course.subject} · {course.exam} faculty</div></div></div>
            </div>
          )}
        </div>

        <aside className="side-card">
          <div className="vis">
            <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice"><rect width="320" height="120" fill="var(--primary)" /><circle cx="60" cy="40" r="46" fill="#fff" opacity=".1" /></svg>
          </div>
          <div className="body">
            <div className="price" style={{ marginBottom: 14 }}>
              {course.price > 0 ? (<><b>{rupee(course.price)}</b>{course.mrp > course.price && <s>{rupee(course.mrp)}</s>}</>) : <span className="free">Free</span>}
            </div>
            {enrolled ? (
              <>
                <div className="badge ok" style={{ marginBottom: 12 }}><CheckIcon size={13} /> Enrolled</div>
                <div className="progress" style={{ marginBottom: 6 }}><i style={{ width: pct + "%" }} /></div>
                <div className="mut" style={{ fontSize: ".82rem", marginBottom: 14 }}>{done.size} / {total} lectures · {pct}%</div>
                <button className="btn block" onClick={() => setTab("chapters")}>Continue learning</button>
              </>
            ) : (
              <button className="btn block" disabled={busy} onClick={enroll}>{busy ? "Please wait…" : course.price > 0 ? "Enroll — " + rupee(course.price) : "Enroll free"}</button>
            )}
            <div style={{ marginTop: 14 }}>
              <div className="kv"><span>Lectures</span><b>{total}</b></div>
              <div className="kv"><span>Chapters</span><b>{course.chapters.length}</b></div>
              <div className="kv"><span>Teacher</span><b>{course.teacher_name}</b></div>
            </div>
            {course.price > 0 && !RAZORPAY_READY && (
              <div className="mut" style={{ fontSize: ".76rem", marginTop: 12, display: "flex", gap: 6 }}><span className="demo-tag">Demo</span> Razorpay not configured — checkout is simulated.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
