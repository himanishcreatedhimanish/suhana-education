"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getState, getDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { BookIcon, ChartIcon, LiveIcon, BellIcon, CheckIcon, PlayIcon, ClockIcon, InfoIcon } from "@/components/icons";

interface VM {
  name: string; cls: string | number; exam: string; studentId: string;
  enrolled: { id: string; title: string; pct: number }[];
  totals: { courses: number; lecturesDone: number; lecturesTotal: number; tests: number; upcoming: number };
  attempts: { id: string; title: string; score: number; max: number; correct: number; wrong: number; at: number }[];
  upcoming: { title: string; courseTitle: string; when: string }[];
  notifications: { body: string; at: number }[];
  plan: { name: string; cls: number } | null;
}

// Short, stable, human-friendly Student ID derived from the account id.
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

export default function Dashboard({ demoCourses }: { demoCourses: Course[] }) {
  const [vm, setVm] = useState<VM | null>(null);
  const [tab, setTab] = useState("overview");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        const supabase = createClient()!;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setNeedsLogin(true); return; }
        const { data: profile } = await supabase.from("profiles").select("full_name,class,target_exam").eq("id", user.id).single();
        const { data: enr } = await supabase.from("enrollments").select("course_id,courses(id,title)").eq("user_id", user.id);
        const courseIds = (enr ?? []).map((e: any) => e.course_id);
        // lectures of enrolled courses
        let lecturesTotal = 0;
        const lectureIds: string[] = [];
        let allLecs: any[] = [];
        if (courseIds.length) {
          const { data: chs } = await supabase.from("chapters").select("id,course_id").in("course_id", courseIds);
          const chIds = (chs ?? []).map((c: any) => c.id);
          if (chIds.length) {
            const { data: lecs } = await supabase.from("lectures").select("id,title,type,scheduled_at,chapter_id").in("chapter_id", chIds);
            allLecs = lecs ?? [];
            lecturesTotal = allLecs.length;
            allLecs.forEach((l: any) => lectureIds.push(l.id));
          }
        }
        const { data: prog } = lectureIds.length
          ? await supabase.from("lecture_progress").select("lecture_id").eq("user_id", user.id).in("lecture_id", lectureIds)
          : { data: [] as any[] };
        const { data: att } = await supabase.from("attempts").select("id,score,max_score,correct,wrong,submitted_at,tests(title)").eq("user_id", user.id).order("submitted_at", { ascending: false });
        const { data: notif } = await supabase.from("notifications").select("body,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
        const { data: sub } = await supabase.from("subscriptions").select("plan_name,class").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();

        const upcoming = allLecs.filter((l) => l.type === "live" && l.scheduled_at).map((l) => ({ title: l.title, courseTitle: "", when: l.scheduled_at }));
        setVm({
          name: profile?.full_name || "Student",
          cls: profile?.class ?? "",
          exam: profile?.target_exam ?? "",
          studentId: studentIdFrom(user.id),
          enrolled: (enr ?? []).map((e: any) => ({ id: e.courses.id, title: e.courses.title, pct: 0 })),
          totals: { courses: courseIds.length, lecturesDone: (prog ?? []).length, lecturesTotal, tests: (att ?? []).length, upcoming: upcoming.length },
          attempts: (att ?? []).map((a: any) => ({ id: a.id, title: a.tests?.title ?? "Test", score: a.score, max: a.max_score, correct: a.correct, wrong: a.wrong, at: new Date(a.submitted_at).getTime() })),
          upcoming,
          notifications: (notif ?? []).map((n: any) => ({ body: n.body, at: new Date(n.created_at).getTime() })),
          plan: sub ? { name: (sub as any).plan_name, cls: (sub as any).class } : null,
        });
      } else {
        const u = getDemoUser();
        if (!u || !u.full_name) { setNeedsLogin(true); return; }
        const s = getState();
        const enrolled = s.enrolled.map((id) => demoCourses.find((c) => c.id === id)).filter(Boolean) as Course[];
        let lecturesTotal = 0, lecturesDone = 0;
        const enrVm = enrolled.map((c) => {
          let t = 0, d = 0;
          c.chapters.forEach((ch) => ch.lectures.forEach((l) => { t++; lecturesTotal++; if (s.progress[c.id + "/" + l.id]) { d++; lecturesDone++; } }));
          return { id: c.id, title: c.title, pct: t ? Math.round((d / t) * 100) : 0 };
        });
        const upcoming = enrolled.flatMap((c) => c.chapters.flatMap((ch) => ch.lectures.filter((l) => l.type === "live" && l.scheduled_at).map((l) => ({ title: l.title, courseTitle: c.title, when: l.scheduled_at! }))));
        setVm({
          name: u.full_name!, cls: u.class ?? "", exam: u.target_exam ?? "",
          studentId: studentIdFrom((u.full_name || "demo") + (u.class ?? "")),
          enrolled: enrVm,
          totals: { courses: enrolled.length, lecturesDone, lecturesTotal, tests: s.attempts.length, upcoming: upcoming.length },
          attempts: s.attempts.slice().reverse().map((a) => ({ id: a.id, title: a.title, score: a.score, max: a.max_score, correct: a.correct, wrong: a.wrong, at: new Date(a.submitted_at).getTime() })),
          upcoming,
          notifications: s.notifications.slice(0, 20),
          plan: s.subscription ? { name: s.subscription.planName, cls: s.subscription.class } : null,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (needsLogin) {
    return (
      <div className="wrap page"><div className="card" style={{ textAlign: "center" }}>
        <h2>Log in to see your dashboard</h2>
        <p className="mut" style={{ margin: "12px 0 18px" }}>Track enrolled courses, progress, live classes and test scores.</p>
        <Link className="btn" href="/login">Log in / Sign up</Link>
      </div></div>
    );
  }
  if (!vm) return <div className="wrap page"><div className="card">Loading your dashboard…</div></div>;

  const NAV: { group: string; items: [string, string, JSX.Element, boolean][] }[] = [
    { group: "Learning", items: [
      ["overview", "Overview", <ChartIcon size={17} key="ov" />, true],
      ["learning", "My Learning", <BookIcon size={17} key="ln" />, true],
      ["live", "Live Classes", <LiveIcon size={17} key="lv" />, true],
      ["recorded", "Recorded Lectures", <PlayIcon size={17} key="rc" />, true],
      ["tests", "Mock Tests", <ChartIcon size={17} key="ts" />, true],
      ["planner", "Study Planner", <ClockIcon size={17} key="pl" />, false],
      ["materials", "Study Materials", <BookIcon size={17} key="mt" />, false],
      ["assignments", "Assignments", <CheckIcon size={17} key="as" />, false],
      ["doubt", "Doubt Solving", <InfoIcon size={17} key="db" />, false],
    ] },
    { group: "Account", items: [
      ["notif", "Notifications", <BellIcon size={17} key="nt" />, true],
      ["profile", "Profile", <InfoIcon size={17} key="pr" />, true],
    ] },
  ];
  const hasPlan = !!vm.plan;
  const Soon = ({ title, desc }: { title: string; desc: string }) => (
    <div className="card ds-soon">
      <span className="ds-soon-badge">Coming soon</span>
      <h3 style={{ marginTop: 12 }}>{title}</h3>
      <p className="mut" style={{ marginTop: 6 }}>{desc}</p>
      <p className="mut" style={{ fontSize: ".84rem", marginTop: 12 }}>This section activates once the related content and backend are configured. Your class and plan are already linked to your account, so it will populate automatically.</p>
    </div>
  );

  return (
    <div className="wrap page">
      <div className="page-head">
        <div><h1>Hi, {vm.name} 👋</h1><p className="mut">{vm.studentId} · Class {vm.cls} · J&amp;K State Board (JKBOSE)</p></div>
        <Link className="btn ghost sm" href="/courses">Browse plans</Link>
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
              {grp.items.map(([id, label, icon, live]) => (
                <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)} title={label}>
                  {icon}{!collapsed && <span className="ds-label">{label}</span>}
                  {!collapsed && !live && <span className="ds-soon-dot">soon</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="ds-main">
          {tab === "overview" && (
            <>
              {vm.plan ? (
                <div className="card ds-plan" style={{ marginBottom: 20 }}>
                  <div><span className="badge ok">Active plan</span><div style={{ fontFamily: "Bricolage Grotesque,sans-serif", fontWeight: 800, fontSize: "1.2rem", marginTop: 6 }}>{vm.plan.name} · Class {vm.plan.cls}</div><div className="mut" style={{ fontSize: ".82rem", marginTop: 2 }}>Payment: <b style={{ color: "var(--ok)" }}>Paid</b> · Enrollment active</div></div>
                  <Link className="btn sm ghost" href="/plans">Manage plan</Link>
                </div>
              ) : (
                <div className="card" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div><b>No active plan yet.</b><div className="mut" style={{ fontSize: ".86rem" }}>Choose a plan to unlock full learning support.</div></div>
                  <Link className="btn sm" href="/plans">View plans</Link>
                </div>
              )}
              <div className="stat-row">
                <div className="stat-c"><div className="n">{vm.totals.courses}</div><div className="l">Enrolled courses</div></div>
                <div className="stat-c"><div className="n">{vm.totals.lecturesDone}/{vm.totals.lecturesTotal}</div><div className="l">Lectures done</div></div>
                <div className="stat-c"><div className="n">{vm.totals.tests}</div><div className="l">Tests taken</div></div>
                <div className="stat-c"><div className="n">{vm.totals.upcoming}</div><div className="l">Upcoming live</div></div>
              </div>
              <div className="grid two">
                <div className="card"><h3 style={{ marginBottom: 6 }}>Continue learning</h3>
                  {vm.enrolled.length ? vm.enrolled.slice(0, 4).map((c) => (
                    <Link key={c.id} href={`/courses/${c.id}`} className="list-row" style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="ic"><BookIcon size={17} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: ".9rem" }}>{c.title}</div><div className="progress" style={{ marginTop: 6 }}><i style={{ width: c.pct + "%" }} /></div></div>
                      <div className="mut tnum" style={{ fontSize: ".82rem" }}>{c.pct}%</div>
                    </Link>
                  )) : <p className="mut" style={{ marginTop: 8 }}>No courses yet. <Link href="/courses" style={{ color: "var(--primary)" }}>Browse plans →</Link></p>}
                </div>
                <div className="card"><h3 style={{ marginBottom: 6 }}>Recent activity</h3>
                  {vm.notifications.length ? vm.notifications.slice(0, 5).map((n, i) => (
                    <div className="list-row" key={i}><div className="ic"><CheckIcon size={16} /></div><div><div style={{ fontSize: ".88rem" }}>{n.body}</div><div className="mut" style={{ fontSize: ".76rem" }}>{timeAgo(n.at)}</div></div></div>
                  )) : <p className="mut" style={{ marginTop: 8 }}>No activity yet.</p>}
                </div>
              </div>
            </>
          )}
          {tab === "learning" && (
            vm.enrolled.length ? (
              <div className="grid two">{vm.enrolled.map((c) => (
                <Link key={c.id} href={`/courses/${c.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
                  <h3 style={{ fontSize: "1.05rem" }}>{c.title}</h3>
                  <div className="progress" style={{ margin: "12px 0 6px" }}><i style={{ width: c.pct + "%" }} /></div>
                  <div className="mut" style={{ fontSize: ".82rem" }}>{c.pct}% complete</div>
                </Link>
              ))}</div>
            ) : <div className="card" style={{ textAlign: "center" }}><p className="mut">You haven&apos;t enrolled yet.</p><Link className="btn" href="/courses" style={{ marginTop: 14 }}>Choose your plan</Link></div>
          )}
          {tab === "recorded" && (
            vm.enrolled.length ? (
              <>
                <p className="mut" style={{ marginBottom: 14, fontSize: ".9rem" }}>Your recorded lecture libraries — open a course to watch and resume.</p>
                <div className="grid two">{vm.enrolled.map((c) => (
                  <Link key={c.id} href={`/courses/${c.id}`} className="card" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 13 }}>
                    <div className="ic" style={{ width: 42, height: 42, borderRadius: 11, background: "var(--primary-soft)", color: "var(--primary)", display: "grid", placeItems: "center", flex: "none" }}><PlayIcon size={19} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: ".98rem" }}>{c.title}</div><div className="progress" style={{ marginTop: 7 }}><i style={{ width: c.pct + "%" }} /></div></div>
                    <span className="mut tnum" style={{ fontSize: ".8rem" }}>{c.pct}%</span>
                  </Link>
                ))}</div>
              </>
            ) : <div className="card" style={{ textAlign: "center" }}><p className="mut">No lecture libraries yet — enroll in a plan to unlock recorded lectures.</p><Link className="btn" href="/courses" style={{ marginTop: 14 }}>Choose your plan</Link></div>
          )}
          {tab === "tests" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <h3>Mock test performance</h3>
                <Link className="btn sm" href="/tests">Take a mock test</Link>
              </div>
              {vm.attempts.length ? (
                <div className="tbl-wrap"><table>
                  <thead><tr><th>Test</th><th>Score</th><th>Correct</th><th>Wrong</th><th></th></tr></thead>
                  <tbody>{vm.attempts.map((a) => (
                    <tr key={a.id}><td><b>{a.title}</b><div className="mut" style={{ fontSize: ".76rem" }}>{timeAgo(a.at)}</div></td><td className="tnum">{a.score}/{a.max}</td><td>{a.correct}</td><td>{a.wrong}</td><td><Link className="mini-btn" href={`/results/${a.id}`}>Analysis</Link></td></tr>
                  ))}</tbody>
                </table></div>
              ) : <div className="card" style={{ textAlign: "center" }}><p className="mut">No tests attempted yet — your scores and subject-wise insights will appear here.</p><Link className="btn" href="/tests" style={{ marginTop: 14 }}>Take your first test</Link></div>}
            </>
          )}
          {tab === "live" && (
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Upcoming live classes</h3>
              {vm.upcoming.length ? vm.upcoming.map((u, i) => (
                <div className="list-row" key={i}><div className="ic"><LiveIcon size={17} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: ".9rem" }}>{u.title}</div><div className="mut" style={{ fontSize: ".78rem" }}>{u.courseTitle ? u.courseTitle + " · " : ""}{new Date(u.when).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div></div><span className="badge" style={{ opacity: .7 }}>Scheduled</span></div>
              )) : <p className="mut">No upcoming live classes from your enrolled courses. Join links appear here when a class is scheduled.</p>}
            </div>
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
                <div className="kv"><span>Enrollment</span><b>{hasPlan ? "Active" : "Not enrolled"}</b></div>
              </div>
              <p className="mut" style={{ fontSize: ".84rem", marginTop: 14 }}>To change your class or plan, visit <Link href="/plans" style={{ color: "var(--primary)", fontWeight: 600 }}>Plans</Link> or contact support.</p>
            </div>
          )}
          {tab === "planner" && <Soon title="Study Planner" desc="A personalised daily & weekly planner with your lectures, learning goals, pending assignments and upcoming tests." />}
          {tab === "materials" && <Soon title="Study Materials" desc="Notes, PDFs, revision sheets and worksheets organised by subject and chapter, with search and downloads." />}
          {tab === "assignments" && <Soon title="Assignments" desc="View assignments with due dates, submit your answers, and get teacher feedback." />}
          {tab === "doubt" && <Soon title="Doubt Solving" desc="Ask subject experts your doubts, attach images, and track replies — all in one place." />}
        </div>
      </div>
    </div>
  );
}
