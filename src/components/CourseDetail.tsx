"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getState, setState } from "@/lib/clientState";
import { toast } from "@/components/toast";
import { RAZORPAY_PUBLIC_KEY, SUPABASE_CONFIGURED } from "@/lib/env";
import { PlayIcon, LiveIcon, CheckIcon, LockIcon, ChevronIcon, InfoIcon, SubjectGlyph, subjectClass } from "@/components/icons";
import CheckoutSheet from "@/components/CheckoutSheet";

// On the client we can only see NEXT_PUBLIC_* vars, so gate real checkout on
// the public Razorpay key (plus Supabase for the server order + verification).
const RAZORPAY_READY = Boolean(RAZORPAY_PUBLIC_KEY) && SUPABASE_CONFIGURED;

function rupee(n: number) { return n > 0 ? "₹" + n.toLocaleString("en-IN") : "Free"; }
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

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
  const [checkout, setCheckout] = useState(false);

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
  const liveLectures = course.chapters.flatMap((ch) => ch.lectures).filter((l) => l.type === "live" && l.scheduled_at);
  const off = course.mrp > course.price && course.price > 0 ? Math.round((1 - course.price / course.mrp) * 100) : 0;

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
    setEnrolled(true); setBusy(false); setCheckout(false); toast("Enrolled in " + course.title);
  }

  // Step 1 for paid courses: require sign-in (live mode), then show the order summary.
  function payAndEnroll() {
    if (!userId && SUPABASE_CONFIGURED) { window.location.href = "/login?next=/courses/" + course.id; return; }
    setCheckout(true);
  }

  // Step 2: pay through Razorpay (live) or grant access (demo).
  async function confirmPay() {
    if (!RAZORPAY_READY) {
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
      if (!order.id) throw new Error(order.error || "Couldn’t start the payment. Try again.");
      await loadRazorpay();
      setCheckout(false);
      const rzp = new window.Razorpay({
        key: RAZORPAY_PUBLIC_KEY, order_id: order.id, amount: order.amount, currency: "INR",
        name: "Suhana Education", description: course.title,
        theme: { color: "#1f4fe0" },
        handler: async (resp: any) => {
          const vr = await fetch("/api/payments/verify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...resp, courseId: course.id }),
          });
          const v = await vr.json();
          if (v.ok) { setEnrolled(true); toast("Payment verified. You’re enrolled."); }
          else toast("We couldn’t verify this payment. If money was deducted, it will be confirmed shortly.");
        },
      });
      rzp.open();
    } catch (e: any) { toast(e.message || "Payment didn’t go through. Try again."); }
    finally { setBusy(false); }
  }

  function loadRazorpay(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(); s.onerror = () => reject(new Error("Couldn’t load Razorpay. Check your connection and try again."));
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

  const tabs: [typeof tab, string][] = [["chapters", "Chapters and lectures"], ["overview", "Overview"], ["schedule", "Live schedule"], ["teacher", "Teacher"]];
  const initials = course.teacher_name.replace(/^(Mr|Ms|Mrs|Dr|Prof)\.?\s+/i, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <header className={"cd-band cover " + subjectClass(course.subject)}>
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span className="sep" aria-hidden /><Link href={`/courses?class=${course.class}`}>Courses</Link><span className="sep" aria-hidden />{course.subject}</nav>
          <div className="cd-tags">
            <span>Class {course.class}</span><span>{course.exam}</span><span>{course.subject}</span><span>{course.type}</span>
          </div>
          <h1>{course.title}</h1>
          {course.description && <p>{course.description}</p>}
          <div className="meta">
            <span>Taught by {course.teacher_name}</span>
            <span>{course.chapters.length} chapter{course.chapters.length !== 1 ? "s" : ""}</span>
            <span>{total} lecture{total !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </header>

      <div className="wrap" style={{ paddingTop: 8, paddingBottom: "clamp(64px, 8vw, 96px)" }}>
        <div className="detail">
          <div>
            <div className="tabs" role="tablist" aria-label="Course sections">
              {tabs.map(([t, label]) => (
                <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{label}</button>
              ))}
            </div>

            {tab === "chapters" && (
              <>
                {!enrolled && (
                  <div className="notice info" style={{ marginBottom: 16 }}><LockIcon size={18} /><div>You can see the full syllabus. Enroll to watch lectures and track your progress.</div></div>
                )}
                <div className="syllabus">
                  {course.chapters.map((ch, i) => (
                    <details key={ch.id} className="chapter" open={i === 0}>
                      <summary>
                        <span className="ch-n">{String(i + 1).padStart(2, "0")}</span>
                        <span className="ch-t">{ch.title}</span>
                        <span className="ch-c">{ch.lectures.length} lecture{ch.lectures.length !== 1 ? "s" : ""}</span>
                        <ChevronIcon size={18} className="caret" />
                      </summary>
                      {ch.lectures.map((l) => {
                        const isDone = done.has(l.id);
                        const live = l.type === "live";
                        return (
                          <div className="lecture" key={l.id}>
                            <div className={"lic" + (isDone ? " done" : "") + (live ? " live" : "")}>{live ? <LiveIcon size={15} /> : isDone ? <CheckIcon size={15} /> : <PlayIcon size={13} />}</div>
                            <div style={{ minWidth: 0 }}>
                              <div className="lt">{l.title}</div>
                              <div className="ls">{live && l.scheduled_at ? `Live, ${when(l.scheduled_at)}` : `${l.duration_min} min`}{l.description ? `. ${l.description}` : ""}</div>
                            </div>
                            <div className="lr">
                              {enrolled ? (
                                live ? <span className="badge live">Live</span>
                                  : <button className="mini-btn" onClick={() => toggleProgress(l.id)} aria-pressed={isDone}>{isDone ? <><CheckIcon size={14} />Done</> : "Mark done"}</button>
                              ) : <span className="lock"><LockIcon size={14} />Locked</span>}
                            </div>
                          </div>
                        );
                      })}
                    </details>
                  ))}
                </div>
              </>
            )}

            {tab === "overview" && (
              <div>
                <h2 style={{ fontSize: "1.25rem" }}>About this course</h2>
                <p style={{ color: "var(--ink-2)", marginTop: 8, maxWidth: "64ch" }}>{course.description}</p>
                <div className="ov-grid">
                  {([["Board", course.exam], ["Class", `Class ${course.class}`], ["Subject", course.subject], ["Format", course.type], ["Chapters", course.chapters.length], ["Lectures", total]] as [string, string | number][]).map(([k, v]) => (
                    <div key={k}><span>{k}</span><b>{v}</b></div>
                  ))}
                </div>
              </div>
            )}

            {tab === "schedule" && (
              liveLectures.length ? (
                <div className="live-list">
                  {liveLectures.map((l) => {
                    const d = new Date(l.scheduled_at!);
                    return (
                      <div className="live-row" key={l.id} style={{ cursor: "default" }}>
                        <div className="live-when"><b>{d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</b><span>{d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span></div>
                        <div><div className="live-title">{l.title}</div><div className="live-sub">{l.duration_min} min{l.description ? `. ${l.description}` : ""}</div></div>
                        <span className="badge live">Live</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty"><p>No live classes are scheduled for this course yet. Recorded lectures are under Chapters and lectures.</p></div>
              )
            )}

            {tab === "teacher" && (
              <div className="panel" style={{ padding: 22 }}>
                <div className="teacher">
                  <span className="av" aria-hidden>{initials}</span>
                  <div><div style={{ fontWeight: 650, fontSize: "1.0625rem" }}>{course.teacher_name}</div><div className="mut" style={{ fontSize: ".875rem" }}>{course.subject} teacher, {course.exam} Class {course.class}</div></div>
                </div>
              </div>
            )}
          </div>

          <aside className="side-card" aria-label="Enrollment">
            <div className={"cover " + subjectClass(course.subject)} style={{ height: 88, display: "flex", alignItems: "flex-end", padding: "14px 22px" }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.24)" }}><SubjectGlyph subject={course.subject} /></span>
            </div>
            <div className="body">
              {enrolled ? (
                <>
                  <div className="enr"><span className="badge ok"><CheckIcon size={13} />Enrolled</span><span className="mut" style={{ fontSize: ".875rem" }}>{pct}% complete</span></div>
                  <div className="enr-prog">
                    <span className="progress"><i style={{ width: pct + "%" }} /></span>
                    <span>{done.size} of {total} lectures done</span>
                  </div>
                  <button className="btn block" onClick={() => setTab("chapters")}>Continue learning</button>
                </>
              ) : (
                <>
                  <div className="price">
                    {course.price > 0 ? (<><b>{rupee(course.price)}</b>{course.mrp > course.price && <s>{rupee(course.mrp)}</s>}{off > 0 && <span className="off">{off}% off</span>}</>) : <span className="free" style={{ fontSize: "1.75rem" }}>Free</span>}
                  </div>
                  <button className="btn lg block" disabled={busy} onClick={enroll}>{busy ? "Please wait…" : course.price > 0 ? "Enroll in this course" : "Enroll for free"}</button>
                  <p className="mut" style={{ fontSize: ".8125rem", marginTop: 10 }}>Or get every Class {course.class} subject with a <Link className="link" href={`/plans?class=${course.class}`}>yearly plan</Link>.</p>
                </>
              )}
              <div className="kvs">
                <div className="kv"><span>Lectures</span><b>{total}</b></div>
                <div className="kv"><span>Chapters</span><b>{course.chapters.length}</b></div>
                <div className="kv"><span>Teacher</span><b>{course.teacher_name}</b></div>
              </div>
              {course.price > 0 && !RAZORPAY_READY && !enrolled && (
                <p className="mut" style={{ fontSize: ".8125rem", marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start" }}><InfoIcon size={16} />Razorpay isn’t configured, so checkout is simulated.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {checkout && (
        <CheckoutSheet
          itemTitle={course.title}
          itemSub={`${course.subject}, Class ${course.class}, ${total} lectures`}
          cover={<span className={"cover " + subjectClass(course.subject)} style={{ width: 52, height: 52, borderRadius: 10, display: "grid", placeItems: "center", flex: "none" }}><SubjectGlyph subject={course.subject} /></span>}
          lines={course.mrp > course.price ? [["Listed price", rupee(course.mrp)], ["Discount", "−" + rupee(course.mrp - course.price)]] : [["Course price", rupee(course.price)]]}
          total={course.price}
          live={RAZORPAY_READY}
          busy={busy}
          onPay={confirmPay}
          onClose={() => setCheckout(false)}
        />
      )}
    </>
  );
}
