"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Course, Test } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getState, setState, getDemoUser, isDownloaded, toggleDownload } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { SUBJECTS } from "@/lib/seed";
import {
  BookIcon, ChartIcon, LiveIcon, BellIcon, CheckIcon, PlayIcon, ClockIcon, InfoIcon,
  DownloadIcon, SUBJECT_META,
} from "@/components/icons";
import LecturePlayer, { PlayerLecture } from "@/components/LecturePlayer";

interface HubLecture {
  id: string; courseId: string; courseTitle: string; subject: string;
  chapterTitle: string; title: string; type: "recorded" | "live";
  duration_min: number; description: string | null; scheduled_at: string | null;
}
interface VM {
  name: string; cls: string | number; exam: string; studentId: string;
  lectures: HubLecture[];
  tests: { id: string; title: string; duration_min: number; marks_correct: number; marks_wrong: number }[];
  enrolled: { id: string; title: string; pct: number }[];
  stats: { lecturesTotal: number; lecturesDone: number; downloads: number; tests: number; upcomingLive: number };
  attempts: { id: string; title: string; score: number; max: number; correct: number; wrong: number; at: number }[];
  notifications: { body: string; at: number }[];
  plan: { name: string; cls: number } | null;
}

function studentIdFrom(raw: string): string {
  const hex = (raw || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return "SUH-" + (hex.slice(0, 6) || "GUEST0").padEnd(6, "0");
}
function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}
function whenLabel(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
const key = (courseId: string, lectureId: string) => courseId + "/" + lectureId;

function flattenCourses(courses: Course[]): HubLecture[] {
  const out: HubLecture[] = [];
  for (const c of courses) {
    for (const ch of c.chapters) {
      for (const l of ch.lectures) {
        out.push({
          id: l.id, courseId: c.id, courseTitle: c.title, subject: c.subject,
          chapterTitle: ch.title, title: l.title, type: l.type,
          duration_min: l.duration_min, description: l.description ?? null,
          scheduled_at: l.scheduled_at ?? null,
        });
      }
    }
  }
  return out;
}

export default function Dashboard({ demoCourses, demoTests }: { demoCourses: Course[]; demoTests: Test[] }) {
  const [vm, setVm] = useState<VM | null>(null);
  const [tab, setTab] = useState("home");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [dl, setDl] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<HubLecture | null>(null);

  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        const supabase = createClient()!;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setNeedsLogin(true); return; }
        const { data: profile } = await supabase.from("profiles").select("full_name,class,target_exam").eq("id", user.id).single();
        const cls = profile?.class ?? null;

        // Whole-class content: courses -> chapters -> lectures, grouped later.
        let courses: Course[] = [];
        if (cls != null) {
          const { data: crs } = await supabase.from("courses").select("id,title,subject,class,exam,type,teacher_name,price,mrp,description").eq("class", cls).eq("published", true).order("subject", { ascending: true });
          const courseIds = (crs ?? []).map((c: any) => c.id);
          const { data: chs } = courseIds.length ? await supabase.from("chapters").select("id,title,position,course_id").in("course_id", courseIds).order("position", { ascending: true }) : { data: [] as any[] };
          const chIds = (chs ?? []).map((c: any) => c.id);
          const { data: lecs } = chIds.length ? await supabase.from("lectures").select("id,title,type,duration_min,description,scheduled_at,position,chapter_id").in("chapter_id", chIds).order("position", { ascending: true }) : { data: [] as any[] };
          courses = (crs ?? []).map((c: any) => ({
            ...c,
            chapters: (chs ?? []).filter((ch: any) => ch.course_id === c.id).map((ch: any) => ({
              ...ch, lectures: (lecs ?? []).filter((l: any) => l.chapter_id === ch.id),
            })),
          })) as Course[];
        }
        const lectures = flattenCourses(courses);

        const { data: tsts } = cls != null ? await supabase.from("tests").select("id,title,duration_min,marks_correct,marks_wrong").eq("class", cls).eq("published", true) : { data: [] as any[] };
        const lectureIds = lectures.map((l) => l.id);
        const { data: prog } = lectureIds.length ? await supabase.from("lecture_progress").select("lecture_id").eq("user_id", user.id).in("lecture_id", lectureIds) : { data: [] as any[] };
        const { data: enr } = await supabase.from("enrollments").select("course_id,courses(id,title)").eq("user_id", user.id);
        const { data: att } = await supabase.from("attempts").select("id,score,max_score,correct,wrong,submitted_at,tests(title)").eq("user_id", user.id).order("submitted_at", { ascending: false });
        const { data: notif } = await supabase.from("notifications").select("body,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
        const { data: sub } = await supabase.from("subscriptions").select("plan_name,class").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();

        // done keys use courseId/lectureId; map via lectures list.
        const progIds = new Set((prog ?? []).map((p: any) => p.lecture_id));
        const d = new Set<string>();
        lectures.forEach((l) => { if (progIds.has(l.id)) d.add(key(l.courseId, l.id)); });
        setDone(d);
        const dset = new Set<string>(lectures.filter((l) => isDownloaded(l.courseId, l.id)).map((l) => key(l.courseId, l.id)));
        setDl(dset);

        const upcoming = lectures.filter((l) => l.type === "live" && l.scheduled_at);
        setVm({
          name: profile?.full_name || "Student", cls: cls ?? "", exam: profile?.target_exam ?? "JKBOSE",
          studentId: studentIdFrom(user.id),
          lectures,
          tests: (tsts ?? []) as any,
          enrolled: (enr ?? []).map((e: any) => ({ id: e.courses.id, title: e.courses.title, pct: 0 })),
          stats: { lecturesTotal: lectures.filter((l) => l.type === "recorded").length, lecturesDone: d.size, downloads: dset.size, tests: (tsts ?? []).length, upcomingLive: upcoming.length },
          attempts: (att ?? []).map((a: any) => ({ id: a.id, title: a.tests?.title ?? "Test", score: a.score, max: a.max_score, correct: a.correct, wrong: a.wrong, at: new Date(a.submitted_at).getTime() })),
          notifications: (notif ?? []).map((n: any) => ({ body: n.body, at: new Date(n.created_at).getTime() })),
          plan: sub ? { name: (sub as any).plan_name, cls: (sub as any).class } : null,
        });
      } else {
        const u = getDemoUser();
        if (!u || !u.full_name) { setNeedsLogin(true); return; }
        const cls = u.class ?? null;
        const courses = demoCourses.filter((c) => cls == null || c.class === cls);
        const lectures = flattenCourses(courses);
        const tests = demoTests.filter((t) => cls == null || t.class === cls).map((t) => ({ id: t.id, title: t.title, duration_min: t.duration_min, marks_correct: t.marks_correct, marks_wrong: t.marks_wrong }));
        const s = getState();
        const d = new Set<string>();
        lectures.forEach((l) => { if (s.progress[key(l.courseId, l.id)]) d.add(key(l.courseId, l.id)); });
        setDone(d);
        const dset = new Set<string>((s.downloads ?? []).filter((k) => lectures.some((l) => key(l.courseId, l.id) === k)));
        setDl(dset);

        const enrolled = s.enrolled.map((id) => courses.find((c) => c.id === id)).filter(Boolean) as Course[];
        const enrVm = enrolled.map((c) => {
          let t = 0, dn = 0;
          c.chapters.forEach((ch) => ch.lectures.forEach((l) => { t++; if (s.progress[key(c.id, l.id)]) dn++; }));
          return { id: c.id, title: c.title, pct: t ? Math.round((dn / t) * 100) : 0 };
        });
        const upcoming = lectures.filter((l) => l.type === "live" && l.scheduled_at);
        setVm({
          name: u.full_name!, cls: cls ?? "", exam: u.target_exam ?? "JKBOSE",
          studentId: studentIdFrom((u.full_name || "demo") + (u.class ?? "")),
          lectures, tests, enrolled: enrVm,
          stats: { lecturesTotal: lectures.filter((l) => l.type === "recorded").length, lecturesDone: d.size, downloads: dset.size, tests: tests.length, upcomingLive: upcoming.length },
          attempts: s.attempts.slice().reverse().map((a) => ({ id: a.id, title: a.title, score: a.score, max: a.max_score, correct: a.correct, wrong: a.wrong, at: new Date(a.submitted_at).getTime() })),
          notifications: s.notifications.slice(0, 20),
          plan: s.subscription ? { name: s.subscription.planName, cls: s.subscription.class } : null,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleDone(courseId: string, lectureId: string) {
    const k = key(courseId, lectureId);
    const next = new Set(done);
    const was = next.has(k);
    if (was) next.delete(k); else next.add(k);
    setDone(next);
    setVm((v) => v ? { ...v, stats: { ...v.stats, lecturesDone: next.size } } : v);
    if (SUPABASE_CONFIGURED) {
      const supabase = createClient()!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (was) await supabase.from("lecture_progress").delete().match({ user_id: user.id, lecture_id: lectureId });
      else await supabase.from("lecture_progress").upsert({ user_id: user.id, lecture_id: lectureId, completed: true });
    } else {
      const s = getState();
      if (was) delete s.progress[k]; else s.progress[k] = true;
      setState(s);
    }
  }
  function toggleDl(courseId: string, lectureId: string) {
    const nowDl = toggleDownload(courseId, lectureId);
    const k = key(courseId, lectureId);
    const next = new Set(dl);
    if (nowDl) next.add(k); else next.delete(k);
    setDl(next);
    setVm((v) => v ? { ...v, stats: { ...v.stats, downloads: next.size } } : v);
  }

  const subjectsPresent = useMemo(() => {
    if (!vm) return [] as string[];
    const set = new Set(vm.lectures.map((l) => l.subject));
    const ordered: string[] = (SUBJECTS as readonly string[]).filter((s) => set.has(s));
    const extra: string[] = [...set].filter((s) => !(SUBJECTS as readonly string[]).includes(s));
    return [...ordered, ...extra];
  }, [vm]);

  if (needsLogin) {
    return (
      <div className="wrap page"><div className="card" style={{ textAlign: "center" }}>
        <h2>Log in to see your dashboard</h2>
        <p className="mut" style={{ margin: "12px 0 18px" }}>Access your live classes, recorded lectures, downloads and mock tests — organised by subject and chapter.</p>
        <Link className="btn" href="/login">Log in / Sign up</Link>
      </div></div>
    );
  }
  if (!vm) return <div className="wrap page"><div className="card">Loading your dashboard…</div></div>;

  const NAV: { group: string; items: [string, string, JSX.Element, boolean][] }[] = [
    { group: "Learning", items: [
      ["home", "Home", <ChartIcon size={17} key="hm" />, true],
      ["live", "Live Classes", <LiveIcon size={17} key="lv" />, true],
      ["recorded", "Recorded Lectures", <PlayIcon size={17} key="rc" />, true],
      ["downloads", "Downloads", <DownloadIcon size={17} key="dl" />, true],
      ["tests", "Mock Tests", <ChartIcon size={17} key="ts" />, true],
      ["progress", "My Progress", <BookIcon size={17} key="pg" />, true],
      ["materials", "Study Materials", <BookIcon size={17} key="mt" />, false],
      ["doubt", "Doubt Solving", <InfoIcon size={17} key="db" />, false],
    ] },
    { group: "Account", items: [
      ["notif", "Notifications", <BellIcon size={17} key="nt" />, true],
      ["profile", "Profile", <InfoIcon size={17} key="pr" />, true],
    ] },
  ];
  const hasPlan = !!vm.plan;

  const toPlayer = (l: HubLecture): PlayerLecture => ({
    id: l.id, courseId: l.courseId, title: l.title, type: l.type, duration_min: l.duration_min,
    description: l.description, scheduled_at: l.scheduled_at, subject: l.subject,
    chapterTitle: l.chapterTitle, courseTitle: l.courseTitle,
  });

  // ---- the subject -> chapter learning hub, filtered by lecture type ----
  function Hub({ type }: { type: "all" | "recorded" | "live" | "downloaded" }) {
    const match = (l: HubLecture) => {
      if (subjectFilter !== "all" && l.subject !== subjectFilter) return false;
      if (type === "recorded") return l.type === "recorded";
      if (type === "live") return l.type === "live";
      if (type === "downloaded") return dl.has(key(l.courseId, l.id));
      return true;
    };
    const lecs = vm!.lectures.filter(match);
    const subs = subjectsPresent.filter((s) => lecs.some((l) => l.subject === s));

    return (
      <>
        <div className="hub-filters">
          <button className={"pill" + (subjectFilter === "all" ? " on" : "")} onClick={() => setSubjectFilter("all")}>All subjects</button>
          {subjectsPresent.map((s) => (
            <button key={s} className={"pill" + (subjectFilter === s ? " on" : "")} onClick={() => setSubjectFilter(s)}>{s}</button>
          ))}
        </div>
        {subs.length === 0 ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p className="mut">
              {type === "downloaded"
                ? "No downloaded lectures yet. Open a recorded lecture and tap Download to save it here for offline access."
                : type === "live"
                ? "No live classes scheduled for your class yet. They'll appear here by subject and chapter."
                : "No lectures available for this class yet. Content is added by subject and chapter — check back soon."}
            </p>
          </div>
        ) : subs.map((subject) => {
          const meta = SUBJECT_META[subject];
          const subjLecs = lecs.filter((l) => l.subject === subject);
          const chapters: { title: string; lectures: HubLecture[] }[] = [];
          subjLecs.forEach((l) => {
            let ch = chapters.find((c) => c.title === l.chapterTitle);
            if (!ch) { ch = { title: l.chapterTitle, lectures: [] }; chapters.push(ch); }
            ch.lectures.push(l);
          });
          return (
            <section className="hub-subject" key={subject}>
              <div className="hub-subject-h">
                <span className="hub-subject-ic" style={meta ? { background: `linear-gradient(135deg, ${meta.c}, ${meta.c2})` } : undefined}>
                  {meta ? <svg viewBox="0 0 24 24" width={20} height={20}>{meta.path}</svg> : <BookIcon size={18} />}
                </span>
                <div><div className="hub-subject-name">{subject}</div><div className="hub-subject-sub">{chapters.length} chapters · {subjLecs.length} {type === "live" ? "classes" : "lectures"}</div></div>
              </div>
              {chapters.map((ch, i) => (
                <details className="hub-chapter" key={ch.title} open={i === 0}>
                  <summary>
                    <svg className="hub-caret" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                    <span className="hub-chapter-title">{ch.title}</span>
                    <span className="hub-chapter-n">{ch.lectures.length}</span>
                  </summary>
                  <div className="hub-lectures">
                    {ch.lectures.map((l) => {
                      const isDone = done.has(key(l.courseId, l.id));
                      const isDl = dl.has(key(l.courseId, l.id));
                      const live = l.type === "live";
                      return (
                        <div className="hub-lec" key={l.courseId + l.id}>
                          <button className={"hub-lec-ic" + (isDone ? " done" : "") + (live ? " live" : "")} onClick={() => setActive(l)} aria-label="Open lecture">
                            {live ? <LiveIcon size={16} /> : isDone ? <CheckIcon size={16} /> : <PlayIcon size={16} />}
                          </button>
                          <div className="hub-lec-main" onClick={() => setActive(l)} role="button" tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter") setActive(l); }}>
                            <div className="hub-lec-title">{l.title}</div>
                            <div className="hub-lec-meta">
                              {live && l.scheduled_at ? <span className="hub-live-when"><LiveIcon size={12} />{whenLabel(l.scheduled_at)}</span> : <span><ClockIcon size={12} />{l.duration_min} min</span>}
                              {isDl && <span className="hub-dl-tag"><DownloadIcon size={12} />Saved</span>}
                              {isDone && !live && <span className="hub-done-tag"><CheckIcon size={12} />Done</span>}
                            </div>
                          </div>
                          <div className="hub-lec-actions">
                            {live ? (
                              <button className="mini-btn" onClick={() => setActive(l)}>Join</button>
                            ) : (
                              <>
                                <button className="mini-btn" onClick={() => setActive(l)}>Watch</button>
                                <button className={"icon-btn sm" + (isDl ? " on" : "")} title={isDl ? "Downloaded" : "Download"} aria-label="Download" onClick={() => toggleDl(l.courseId, l.id)}>
                                  {isDl ? <CheckIcon size={15} /> : <DownloadIcon size={15} />}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </section>
          );
        })}
      </>
    );
  }

  function TestsGrid({ limit }: { limit?: number }) {
    const list = limit ? vm!.tests.slice(0, limit) : vm!.tests;
    if (!list.length) return <div className="card" style={{ textAlign: "center" }}><p className="mut">No mock tests for your class yet. They'll appear here when published.</p></div>;
    return (
      <div className="grid">
        {list.map((t) => (
          <article className="card" key={t.id}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}><span className="badge">JKBOSE</span><span className="badge accent">Class {vm!.cls}</span></div>
            <h3 style={{ fontSize: "1.08rem" }}>{t.title}</h3>
            <div className="pmeta" style={{ margin: "12px 0" }}><span className="d"><ClockIcon size={14} />{t.duration_min} min</span><span className="d"><ChartIcon size={14} />{t.marks_correct} / {t.marks_wrong} marking</span></div>
            <Link className="btn sm" href={`/tests/${t.id}`}>Start test</Link>
          </article>
        ))}
      </div>
    );
  }

  const upcomingLive = vm.lectures.filter((l) => l.type === "live" && l.scheduled_at).sort((a, b) => (a.scheduled_at! < b.scheduled_at! ? -1 : 1));

  return (
    <div className="wrap page">
      <div className="page-head">
        <div><h1>Hi, {vm.name} 👋</h1><p className="mut">{vm.studentId} · Class {vm.cls} · J&amp;K State Board (JKBOSE)</p></div>
        <Link className="btn ghost sm" href="/plans">{hasPlan ? "Manage plan" : "View plans"}</Link>
      </div>
      <div className={"dash" + (collapsed ? " collapsed" : "")}>
        <nav className="dnav ds-side">
          <button className="ds-collapse" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} /></svg>
            {!collapsed && <span>Collapse</span>}
          </button>
          {NAV.map((grp) => (
            <div key={grp.group} className="ds-group">
              {!collapsed && <div className="ds-group-h">{grp.group}</div>}
              {grp.items.map(([id, label, icon, ready]) => (
                <button key={id} className={tab === id ? "on" : ""} onClick={() => { setTab(id); }} title={label}>
                  {icon}{!collapsed && <span className="ds-label">{label}</span>}
                  {!collapsed && !ready && <span className="ds-soon-dot">soon</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="ds-main">
          {tab === "home" && (
            <>
              {vm.plan ? (
                <div className="card ds-plan" style={{ marginBottom: 20 }}>
                  <div><span className="badge ok">Active plan</span><div style={{ fontFamily: "Plus Jakarta Sans,sans-serif", fontWeight: 800, fontSize: "1.2rem", marginTop: 6 }}>{vm.plan.name} · Class {vm.plan.cls}</div><div className="mut" style={{ fontSize: ".82rem", marginTop: 2 }}>Payment: <b style={{ color: "var(--ok)" }}>Paid</b> · Enrollment active</div></div>
                  <Link className="btn sm ghost" href="/plans">Manage plan</Link>
                </div>
              ) : (
                <div className="card" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div><b>No active plan yet.</b><div className="mut" style={{ fontSize: ".86rem" }}>You can explore the content below. Choose a plan to unlock everything.</div></div>
                  <Link className="btn sm" href="/plans">View plans</Link>
                </div>
              )}

              <div className="stat-row">
                <div className="stat-c"><div className="n">{vm.stats.lecturesDone}/{vm.stats.lecturesTotal}</div><div className="l">Lectures done</div></div>
                <div className="stat-c"><div className="n">{vm.stats.upcomingLive}</div><div className="l">Upcoming live</div></div>
                <div className="stat-c"><div className="n">{vm.stats.downloads}</div><div className="l">Downloads</div></div>
                <div className="stat-c"><div className="n">{vm.stats.tests}</div><div className="l">Mock tests</div></div>
              </div>

              {upcomingLive.length > 0 && (
                <section style={{ marginBottom: 26 }}>
                  <div className="hub-sec-h"><h2><LiveIcon size={19} />Live classes</h2><button className="mini-btn" onClick={() => setTab("live")}>View all</button></div>
                  <div className="live-strip">
                    {upcomingLive.slice(0, 3).map((l) => (
                      <button className="live-card" key={l.courseId + l.id} onClick={() => setActive(l)}>
                        <span className="live-dot" /> <span className="live-when">{whenLabel(l.scheduled_at!)}</span>
                        <div className="live-title">{l.title}</div>
                        <div className="live-sub">{l.subject} · {l.chapterTitle}</div>
                        <span className="live-join">Join class →</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section style={{ marginBottom: 26 }}>
                <div className="hub-sec-h"><h2><PlayIcon size={18} />Lectures — by subject &amp; chapter</h2></div>
                <Hub type="all" />
              </section>

              <section>
                <div className="hub-sec-h"><h2><ChartIcon size={18} />Mock tests</h2><button className="mini-btn" onClick={() => setTab("tests")}>View all</button></div>
                <TestsGrid limit={2} />
              </section>
            </>
          )}

          {tab === "live" && (
            <>
              <div className="hub-sec-h"><h2><LiveIcon size={19} />Live classes</h2></div>
              <p className="mut" style={{ margin: "0 0 16px", fontSize: ".9rem" }}>Scheduled live sessions for Class {vm.cls}, organised by subject and chapter. Join links open from each class.</p>
              <Hub type="live" />
            </>
          )}
          {tab === "recorded" && (
            <>
              <div className="hub-sec-h"><h2><PlayIcon size={18} />Recorded lectures</h2></div>
              <p className="mut" style={{ margin: "0 0 16px", fontSize: ".9rem" }}>Pre-recorded lectures for Class {vm.cls}, by subject and chapter. Watch anytime, mark done, or download for offline.</p>
              <Hub type="recorded" />
            </>
          )}
          {tab === "downloads" && (
            <>
              <div className="hub-sec-h"><h2><DownloadIcon size={18} />Downloaded lectures</h2></div>
              <p className="mut" style={{ margin: "0 0 16px", fontSize: ".9rem" }}>Lectures you saved for offline access, by subject and chapter. These stay available on this device.</p>
              <Hub type="downloaded" />
            </>
          )}
          {tab === "tests" && (
            <>
              <div className="hub-sec-h"><h2><ChartIcon size={18} />Mock tests</h2><Link className="mini-btn" href="/tests">All tests</Link></div>
              <TestsGrid />
              {vm.attempts.length > 0 && (
                <>
                  <h3 style={{ margin: "26px 0 12px" }}>Your recent attempts</h3>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Test</th><th>Score</th><th>Correct</th><th>Wrong</th><th></th></tr></thead>
                    <tbody>{vm.attempts.map((a) => (
                      <tr key={a.id}><td><b>{a.title}</b><div className="mut" style={{ fontSize: ".76rem" }}>{timeAgo(a.at)}</div></td><td className="tnum">{a.score}/{a.max}</td><td>{a.correct}</td><td>{a.wrong}</td><td><Link className="mini-btn" href={`/results/${a.id}`}>Analysis</Link></td></tr>
                    ))}</tbody>
                  </table></div>
                </>
              )}
            </>
          )}
          {tab === "progress" && (
            vm.enrolled.length ? (
              <>
                <div className="hub-sec-h"><h2><BookIcon size={18} />My progress</h2></div>
                <div className="grid two" style={{ marginTop: 6 }}>{vm.enrolled.map((c) => (
                  <Link key={c.id} href={`/courses/${c.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
                    <h3 style={{ fontSize: "1.05rem" }}>{c.title}</h3>
                    <div className="progress" style={{ margin: "12px 0 6px" }}><i style={{ width: c.pct + "%" }} /></div>
                    <div className="mut" style={{ fontSize: ".82rem" }}>{c.pct}% complete</div>
                  </Link>
                ))}</div>
              </>
            ) : <div className="card" style={{ textAlign: "center" }}><p className="mut">Your course progress will appear here as you watch lectures. Start from Recorded lectures above.</p><button className="btn" style={{ marginTop: 14 }} onClick={() => setTab("recorded")}>Browse recorded lectures</button></div>
          )}
          {tab === "notif" && (
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Notifications</h3>
              {vm.notifications.length ? vm.notifications.map((n, i) => (
                <div className="list-row" key={i}><div className="ic"><BellIcon size={16} /></div><div><div style={{ fontSize: ".9rem" }}>{n.body}</div><div className="mut" style={{ fontSize: ".76rem" }}>{timeAgo(n.at)}</div></div></div>
              )) : <p className="mut">No notifications yet.</p>}
            </div>
          )}
          {tab === "profile" && (
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Profile</h3>
              <div className="ds-profile">
                <div className="kv"><span>Full name</span><b>{vm.name}</b></div>
                <div className="kv"><span>Student ID</span><b className="tnum">{vm.studentId}</b></div>
                <div className="kv"><span>Class</span><b>Class {vm.cls}</b></div>
                <div className="kv"><span>Board</span><b>JKBOSE (J&amp;K State Board)</b></div>
                <div className="kv"><span>Plan</span><b>{hasPlan ? `${vm.plan!.name} · Class ${vm.plan!.cls}` : "No active plan"}</b></div>
                <div className="kv"><span>Payment status</span><b style={{ color: hasPlan ? "var(--ok)" : "var(--muted)" }}>{hasPlan ? "Paid" : "Pending"}</b></div>
              </div>
              <p className="mut" style={{ fontSize: ".84rem", marginTop: 14 }}>To change your class or plan, visit <Link href="/plans" style={{ color: "var(--primary)", fontWeight: 600 }}>Plans</Link> or contact support.</p>
            </div>
          )}
          {tab === "materials" && (
            <div className="card ds-soon"><span className="ds-soon-badge">Coming soon</span><h3 style={{ marginTop: 12 }}>Study Materials</h3><p className="mut" style={{ marginTop: 6 }}>Notes, PDFs and worksheets organised by subject and chapter, with search and downloads.</p></div>
          )}
          {tab === "doubt" && (
            <div className="card ds-soon"><span className="ds-soon-badge">Coming soon</span><h3 style={{ marginTop: 12 }}>Doubt Solving</h3><p className="mut" style={{ marginTop: 6 }}>Ask subject experts your doubts, attach images, and track replies — all in one place.</p></div>
          )}
        </div>
      </div>

      {active && (
        <LecturePlayer
          lecture={toPlayer(active)}
          done={done.has(key(active.courseId, active.id))}
          downloaded={dl.has(key(active.courseId, active.id))}
          onClose={() => setActive(null)}
          onToggleDone={() => toggleDone(active.courseId, active.id)}
          onToggleDownload={() => toggleDl(active.courseId, active.id)}
        />
      )}
    </div>
  );
}
