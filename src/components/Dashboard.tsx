"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Course, Test } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getState, setState, getDemoUser, isDownloaded, toggleDownload } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { SUBJECTS } from "@/lib/seed";
import { planById, priceBreakdown } from "@/lib/plans";
import {
  ChartIcon, LiveIcon, BellIcon, CheckIcon, PlayIcon, ClockIcon, DownloadIcon, ReceiptIcon,
  HomeIcon, TargetIcon, FileIcon, HelpIcon, UserIcon, ChevronIcon, ChevronLeftIcon, SubjectGlyph, subjectClass,
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
  orders: { id: string; item: string; kind: "plan" | "course"; amount: number; status: string; at: number; ref?: string | null }[];
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
        const { data: ord } = await supabase.from("orders").select("id,amount,status,created_at,plan_id,course_id,razorpay_payment_id,courses(title)").eq("user_id", user.id).order("created_at", { ascending: false });
        const supaOrders = (ord ?? []).map((o: any) => ({ id: o.id, kind: (o.plan_id ? "plan" : "course") as "plan" | "course", item: o.plan_id ? (planById(o.plan_id)?.name ?? "Plan") : (o.courses?.title ?? "Course"), amount: o.amount, status: o.status, at: new Date(o.created_at).getTime(), ref: o.razorpay_payment_id }));

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
          orders: supaOrders,
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
        const subPlan = s.subscription ? planById(s.subscription.planId) : null;
        const demoOrders = s.subscription
          ? [{ id: "demo-" + s.subscription.at, kind: "plan" as const, item: s.subscription.planName, amount: subPlan ? priceBreakdown(subPlan.price).total * 100 : 0, status: "paid", at: s.subscription.at, ref: "DEMO" }]
          : [];
        setVm({
          name: u.full_name!, cls: cls ?? "", exam: u.target_exam ?? "JKBOSE",
          studentId: studentIdFrom((u.full_name || "demo") + (u.class ?? "")),
          lectures, tests, enrolled: enrVm,
          stats: { lecturesTotal: lectures.filter((l) => l.type === "recorded").length, lecturesDone: d.size, downloads: dset.size, tests: tests.length, upcomingLive: upcoming.length },
          attempts: s.attempts.slice().reverse().map((a) => ({ id: a.id, title: a.title, score: a.score, max: a.max_score, correct: a.correct, wrong: a.wrong, at: new Date(a.submitted_at).getTime() })),
          notifications: s.notifications.slice(0, 20),
          plan: s.subscription ? { name: s.subscription.planName, cls: s.subscription.class } : null,
          orders: demoOrders,
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
      <div className="wrap page">
        <div className="empty" style={{ maxWidth: 560, margin: "clamp(24px, 6vw, 64px) auto 0" }}>
          <h2 style={{ fontSize: "1.5rem" }}>Log in to see your dashboard</h2>
          <p style={{ marginTop: 10 }}>Your live classes, recorded lectures, downloads and mock tests are organised by subject and chapter once you sign in.</p>
          <Link className="btn" href="/login">Log in or sign up</Link>
        </div>
      </div>
    );
  }
  if (!vm) {
    return (
      <div className="wrap page" aria-busy="true">
        <p className="sr-only">Loading your dashboard</p>
        <div style={{ display: "grid", gap: 14, maxWidth: 720 }} aria-hidden>
          {[38, 18, 120, 220].map((h, i) => <div key={i} style={{ height: h, borderRadius: 10, background: "var(--mist)", width: i === 1 ? "40%" : "100%" }} />)}
        </div>
      </div>
    );
  }

  const NAV: { group: string; items: [string, string, JSX.Element, boolean][] }[] = [
    { group: "Learning", items: [
      ["home", "Overview", <HomeIcon size={18} key="hm" />, true],
      ["live", "Live classes", <LiveIcon size={18} key="lv" />, true],
      ["recorded", "Recorded lectures", <PlayIcon size={16} key="rc" />, true],
      ["downloads", "Downloads", <DownloadIcon size={18} key="dl" />, true],
      ["tests", "Mock tests", <TargetIcon size={18} key="ts" />, true],
      ["progress", "My progress", <ChartIcon size={18} key="pg" />, true],
      ["materials", "Study materials", <FileIcon size={18} key="mt" />, false],
      ["doubt", "Doubt solving", <HelpIcon size={18} key="db" />, false],
    ] },
    { group: "Account", items: [
      ["purchases", "Purchases", <ReceiptIcon size={18} key="pu" />, true],
      ["notif", "Notifications", <BellIcon size={18} key="nt" />, true],
      ["profile", "Profile", <UserIcon size={18} key="pr" />, true],
    ] },
  ];
  const hasPlan = !!vm.plan;
  const firstName = vm.name.split(" ")[0];

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
        {subjectsPresent.length > 1 && (
          <div className="chips hub-filters" role="group" aria-label="Filter by subject">
            <button className={"pill" + (subjectFilter === "all" ? " on" : "")} aria-pressed={subjectFilter === "all"} onClick={() => setSubjectFilter("all")}>All subjects</button>
            {subjectsPresent.map((s) => (
              <button key={s} className={"pill" + (subjectFilter === s ? " on" : "")} aria-pressed={subjectFilter === s} onClick={() => setSubjectFilter(s)}>{s}</button>
            ))}
          </div>
        )}
        {subs.length === 0 ? (
          <div className="empty">
            <p>
              {type === "downloaded"
                ? "Nothing downloaded yet. Open a recorded lecture and choose Download to keep it here for offline study."
                : type === "live"
                ? "No live classes are scheduled for your class yet. They’ll appear here by subject and chapter."
                : "No lectures for this class yet. Content is added by subject and chapter, so check back soon."}
            </p>
            {type === "downloaded" && <button className="btn ghost" onClick={() => setTab("recorded")}>Browse recorded lectures</button>}
          </div>
        ) : subs.map((subject) => {
          const subjLecs = lecs.filter((l) => l.subject === subject);
          const chapters: { title: string; lectures: HubLecture[] }[] = [];
          subjLecs.forEach((l) => {
            let ch = chapters.find((c) => c.title === l.chapterTitle);
            if (!ch) { ch = { title: l.chapterTitle, lectures: [] }; chapters.push(ch); }
            ch.lectures.push(l);
          });
          return (
            <section className={"hub-subject " + subjectClass(subject)} key={subject}>
              <div className="hub-subject-h">
                <span className="sub-chip"><SubjectGlyph subject={subject} size={18} /></span>
                <div><div className="hub-subject-name">{subject}</div><div className="hub-subject-sub">{chapters.length} chapter{chapters.length !== 1 ? "s" : ""}, {subjLecs.length} {type === "live" ? "classes" : "lectures"}</div></div>
              </div>
              <div className="hub-box">
                {chapters.map((ch, i) => (
                  <details className="hub-chapter" key={ch.title} open={i === 0}>
                    <summary>
                      <ChevronIcon size={16} className="caret" />
                      <span className="hub-chapter-title">{ch.title}</span>
                      <span className="hub-chapter-n">{ch.lectures.length}</span>
                    </summary>
                    <div>
                      {ch.lectures.map((l) => {
                        const isDone = done.has(key(l.courseId, l.id));
                        const isDl = dl.has(key(l.courseId, l.id));
                        const live = l.type === "live";
                        return (
                          <div className="hub-lec" key={l.courseId + l.id}>
                            <button className={"hub-lec-ic" + (isDone ? " done" : "") + (live ? " live" : "")} onClick={() => setActive(l)} aria-label={(live ? "Open live class: " : "Play lecture: ") + l.title}>
                              {live ? <LiveIcon size={15} /> : isDone ? <CheckIcon size={15} /> : <PlayIcon size={13} />}
                            </button>
                            <div className="hub-lec-main" onClick={() => setActive(l)} role="button" tabIndex={0}
                              onKeyDown={(e) => { if (e.key === "Enter") setActive(l); }}>
                              <div className="hub-lec-title">{l.title}</div>
                              <div className="hub-lec-meta">
                                {live && l.scheduled_at ? <span className="hub-live-when">{whenLabel(l.scheduled_at)}</span> : <span><ClockIcon size={13} />{l.duration_min} min</span>}
                                {isDl && <span className="hub-dl-tag"><DownloadIcon size={13} />Saved</span>}
                                {isDone && !live && <span className="hub-done-tag"><CheckIcon size={13} />Done</span>}
                              </div>
                            </div>
                            <div className="hub-lec-actions">
                              {live ? (
                                <button className="mini-btn" onClick={() => setActive(l)}>Join</button>
                              ) : (
                                <>
                                  <button className="mini-btn" onClick={() => setActive(l)}>Watch</button>
                                  <button className={"icon-btn sm" + (isDl ? " on" : "")} title={isDl ? "Downloaded" : "Download"} aria-label={isDl ? "Remove download" : "Download"} aria-pressed={isDl} onClick={() => toggleDl(l.courseId, l.id)}>
                                    {isDl ? <CheckIcon size={16} /> : <DownloadIcon size={16} />}
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
              </div>
            </section>
          );
        })}
      </>
    );
  }

  function TestsList({ limit }: { limit?: number }) {
    const list = limit ? vm!.tests.slice(0, limit) : vm!.tests;
    if (!list.length) return <div className="empty"><p>No mock tests for your class yet. They’ll appear here as soon as they’re published.</p></div>;
    return (
      <div className="test-list">
        {list.map((t) => (
          <div className="test-row" key={t.id}>
            <div className="tr-main">
              <h3>{t.title}</h3>
              <div className="meta"><span><ClockIcon size={14} />{t.duration_min} min</span><span>+{t.marks_correct} correct, {t.marks_wrong} wrong</span></div>
            </div>
            <Link className="btn sm" href={`/tests/${t.id}`}>Start test</Link>
          </div>
        ))}
      </div>
    );
  }

  function PlanBanner() {
    return vm!.plan ? (
      <div className="ds-plan active">
        <div className="l">
          <span className="lead-ic"><CheckIcon size={20} /></span>
          <div><div className="t">{vm!.plan.name}, Class {vm!.plan.cls}</div><div className="s">Paid and active. All your Class {vm!.plan.cls} content is unlocked.</div></div>
        </div>
        <Link className="btn sm ghost" href="/plans">Manage plan</Link>
      </div>
    ) : (
      <div className="ds-plan">
        <div><div className="t">You don’t have a plan yet</div><div className="s">Explore the lectures below. A plan unlocks live classes, recordings and study material for the year.</div></div>
        <Link className="btn sm" href="/plans">View plans</Link>
      </div>
    );
  }

  const upcomingLive = vm.lectures.filter((l) => l.type === "live" && l.scheduled_at).sort((a, b) => (a.scheduled_at! < b.scheduled_at! ? -1 : 1));
  const lecturesPct = vm.stats.lecturesTotal ? Math.round((vm.stats.lecturesDone / vm.stats.lecturesTotal) * 100) : 0;

  return (
    <div className="wrap page">
      <div className="dash-head">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <div className="meta">
            <span>Student ID <b className="tnum" style={{ color: "var(--ink)", fontWeight: 600 }}>{vm.studentId}</b></span>
            {vm.cls !== "" && <span>Class {vm.cls}</span>}
            <span>J&amp;K State Board (JKBOSE)</span>
          </div>
        </div>
        <Link className="btn ghost sm" href="/plans">{hasPlan ? "Manage plan" : "View plans"}</Link>
      </div>
      <div className={"dash" + (collapsed ? " collapsed" : "")}>
        <nav className="dnav" aria-label="Dashboard">
          <button className="ds-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? <ChevronIcon size={18} /> : <ChevronLeftIcon size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
          {NAV.map((grp) => (
            <div key={grp.group} className="ds-group">
              {!collapsed && <div className="ds-group-h">{grp.group}</div>}
              {grp.items.map(([id, label, icon, ready]) => (
                <button key={id} className={tab === id ? "on" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); }} title={label}>
                  {icon}{!collapsed && <span>{label}</span>}
                  {!collapsed && !ready && <span className="ds-soon-dot">Soon</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="ds-main">
          {tab === "home" && (
            <>
              <PlanBanner />

              <div className="stat-row">
                <div className="stat-c"><div className="n">{vm.stats.lecturesDone}<small> of {vm.stats.lecturesTotal}</small></div><div className="l">Lectures done ({lecturesPct}%)</div></div>
                <div className="stat-c"><div className="n">{vm.stats.upcomingLive}</div><div className="l">Upcoming live classes</div></div>
                <div className="stat-c"><div className="n">{vm.stats.downloads}</div><div className="l">Downloaded lectures</div></div>
                <div className="stat-c"><div className="n">{vm.stats.tests}</div><div className="l">Mock tests available</div></div>
              </div>

              {upcomingLive.length > 0 && (
                <section className="hub-sec">
                  <div className="hub-sec-h"><h2>Next live classes</h2><button className="mini-btn" onClick={() => setTab("live")}>See all</button></div>
                  <div className="live-list">
                    {upcomingLive.slice(0, 3).map((l) => {
                      const d = new Date(l.scheduled_at!);
                      return (
                        <button className={"live-row " + subjectClass(l.subject)} key={l.courseId + l.id} onClick={() => setActive(l)}>
                          <span className="live-when"><b>{d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}</b><span>{d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span></span>
                          <span><span className="live-title" style={{ display: "block" }}>{l.title}</span><span className="live-sub" style={{ display: "block" }}>{l.subject}, {l.chapterTitle}</span></span>
                          <span className="mini-btn primary">Join</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="hub-sec">
                <div className="hub-sec-h"><h2>Lectures by subject</h2></div>
                <Hub type="all" />
              </section>

              <section className="hub-sec">
                <div className="hub-sec-h"><h2>Mock tests</h2><button className="mini-btn" onClick={() => setTab("tests")}>See all</button></div>
                <TestsList limit={2} />
              </section>
            </>
          )}

          {tab === "live" && (
            <section>
              <div className="hub-sec-h"><h2>Live classes</h2></div>
              <p className="hub-intro">Scheduled live sessions for Class {vm.cls}, by subject and chapter. Open a class to join when it starts.</p>
              <Hub type="live" />
            </section>
          )}
          {tab === "recorded" && (
            <section>
              <div className="hub-sec-h"><h2>Recorded lectures</h2></div>
              <p className="hub-intro">Every recorded lecture for Class {vm.cls}. Watch at any time, mark lectures done, or download them for offline study.</p>
              <Hub type="recorded" />
            </section>
          )}
          {tab === "downloads" && (
            <section>
              <div className="hub-sec-h"><h2>Downloads</h2></div>
              <p className="hub-intro">Lectures you saved for offline study on this device.</p>
              <Hub type="downloaded" />
            </section>
          )}
          {tab === "tests" && (
            <section>
              <div className="hub-sec-h"><h2>Mock tests</h2><Link className="mini-btn" href="/tests">All test series</Link></div>
              <TestsList />
              {vm.attempts.length > 0 && (
                <>
                  <h3 style={{ margin: "32px 0 12px" }}>Your attempts</h3>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Test</th><th>Score</th><th>Correct</th><th>Wrong</th><th><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>{vm.attempts.map((a) => (
                      <tr key={a.id}><td><b style={{ fontWeight: 600 }}>{a.title}</b><div className="mut" style={{ fontSize: ".8125rem" }}>{timeAgo(a.at)}</div></td><td className="tnum">{a.score} / {a.max}</td><td className="tnum">{a.correct}</td><td className="tnum">{a.wrong}</td><td><Link className="mini-btn" href={`/results/${a.id}`}>View analysis</Link></td></tr>
                    ))}</tbody>
                  </table></div>
                </>
              )}
            </section>
          )}
          {tab === "progress" && (
            <section>
              <div className="hub-sec-h"><h2>My progress</h2></div>
              {vm.enrolled.length ? (
                <div className="live-list">
                  {vm.enrolled.map((c) => (
                    <Link key={c.id} href={`/courses/${c.id}`} className="row-link" style={{ padding: "16px 18px" }}>
                      <span className="rl-main"><span className="rl-title">{c.title}</span><span className="progress"><i style={{ width: c.pct + "%" }} /></span></span>
                      <span className="mut" style={{ fontSize: ".875rem", minWidth: 80, textAlign: "right" }}>{c.pct}% done</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <p>Your course progress shows up here as you complete lectures.</p>
                  <button className="btn" onClick={() => setTab("recorded")}>Start with recorded lectures</button>
                </div>
              )}
            </section>
          )}
          {tab === "purchases" && (
            <section>
              <div className="hub-sec-h"><h2>Purchases and payments</h2></div>
              <PlanBanner />

              <h3 style={{ margin: "28px 0 12px" }}>Your courses</h3>
              {vm.enrolled.length ? (
                <div className="live-list">
                  {vm.enrolled.map((c) => (
                    <div className="row-link" key={c.id} style={{ padding: "14px 18px" }}>
                      <span className="rl-main" style={{ gap: 2 }}><span className="rl-title">{c.title}</span><span className="rl-sub">{c.pct}% complete</span></span>
                      <Link className="mini-btn" href={`/courses/${c.id}`}>Open</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty"><p>No individual course purchases. {vm.plan ? "Your plan already covers your class content." : "Subscribe to a plan or enroll in a course to see it here."}</p></div>
              )}

              <h3 style={{ margin: "32px 0 12px" }}>Payment history</h3>
              {vm.orders.length ? (
                <div className="tbl-wrap"><table>
                  <thead><tr><th>Date</th><th>Item</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead>
                  <tbody>{vm.orders.map((o) => (
                    <tr key={o.id}>
                      <td>{new Date(o.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td><b style={{ fontWeight: 600 }}>{o.item}</b><div className="mut" style={{ fontSize: ".8125rem" }}>{o.kind === "plan" ? "Subscription" : "Course"}</div></td>
                      <td>₹{(o.amount / 100).toLocaleString("en-IN")}</td>
                      <td><span className={"badge" + (o.status === "paid" ? " ok" : "")}>{o.status === "paid" ? "Paid" : o.status}</span></td>
                      <td className="mut" style={{ fontSize: ".8125rem" }}>{o.ref || "None"}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              ) : (
                <div className="empty"><p>No payments yet. When you subscribe or buy a course, the receipt appears here with the amount, date and payment reference.</p></div>
              )}
            </section>
          )}
          {tab === "notif" && (
            <section>
              <div className="hub-sec-h"><h2>Notifications</h2></div>
              {vm.notifications.length ? (
                <div className="live-list">
                  {vm.notifications.map((n, i) => (
                    <div className="row-link" key={i} style={{ padding: "14px 18px", alignItems: "flex-start" }}>
                      <span style={{ color: "var(--cobalt)", marginTop: 2 }}><BellIcon size={18} /></span>
                      <span className="rl-main" style={{ gap: 2 }}><span style={{ fontSize: ".9375rem" }}>{n.body}</span><span className="rl-sub">{timeAgo(n.at)}</span></span>
                    </div>
                  ))}
                </div>
              ) : <div className="empty"><p>You’re all caught up. Payment confirmations, enrollments and test results will appear here.</p></div>}
            </section>
          )}
          {tab === "profile" && (
            <section style={{ maxWidth: 640 }}>
              <div className="hub-sec-h"><h2>Profile</h2></div>
              <div className="panel" style={{ padding: "6px 22px" }}>
                <div className="ds-profile">
                  <div className="kv"><span>Full name</span><b>{vm.name}</b></div>
                  <div className="kv"><span>Student ID</span><b className="tnum">{vm.studentId}</b></div>
                  <div className="kv"><span>Class</span><b>Class {vm.cls}</b></div>
                  <div className="kv"><span>Board</span><b>JKBOSE (J&amp;K State Board)</b></div>
                  <div className="kv"><span>Plan</span><b>{hasPlan ? `${vm.plan!.name}, Class ${vm.plan!.cls}` : "No active plan"}</b></div>
                  <div className="kv"><span>Payment status</span><b style={{ color: hasPlan ? "var(--ok)" : "var(--muted)" }}>{hasPlan ? "Paid" : "Not subscribed"}</b></div>
                </div>
              </div>
              <p className="mut" style={{ fontSize: ".875rem", marginTop: 14 }}>To change your class or plan, go to <Link className="link" href="/plans">Plans</Link> or contact support.</p>
            </section>
          )}
          {tab === "materials" && (
            <div className="empty ds-soon"><span className="badge cobalt">Coming soon</span><h3>Study materials</h3><p>Notes, PDFs and worksheets organised by subject and chapter, with search and downloads.</p></div>
          )}
          {tab === "doubt" && (
            <div className="empty ds-soon"><span className="badge cobalt">Coming soon</span><h3>Doubt solving</h3><p>Ask subject teachers your doubts, attach a photo of the problem, and follow the reply here.</p></div>
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
