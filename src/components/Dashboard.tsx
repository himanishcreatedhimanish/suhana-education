"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getState, getDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { BookIcon, ChartIcon, LiveIcon, BellIcon, CheckIcon } from "@/components/icons";

interface VM {
  name: string; cls: string | number; exam: string;
  enrolled: { id: string; title: string; pct: number }[];
  totals: { courses: number; lecturesDone: number; lecturesTotal: number; tests: number; upcoming: number };
  attempts: { id: string; title: string; score: number; max: number; correct: number; wrong: number; at: number }[];
  upcoming: { title: string; courseTitle: string; when: string }[];
  notifications: { body: string; at: number }[];
  plan: { name: string; cls: number } | null;
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

  const items: [string, string, JSX.Element][] = [
    ["overview", "Overview", <ChartIcon size={17} key="o" />],
    ["courses", "My courses", <BookIcon size={17} key="c" />],
    ["tests", "Test performance", <ChartIcon size={17} key="t" />],
    ["live", "Live classes", <LiveIcon size={17} key="l" />],
    ["notif", "Notifications", <BellIcon size={17} key="n" />],
  ];

  return (
    <div className="wrap page">
      <div className="page-head">
        <div><h1>Hi, {vm.name} 👋</h1><p>Class {vm.cls} · J&amp;K State Board (JKBOSE)</p></div>
        <Link className="btn ghost sm" href="/courses">Browse courses</Link>
      </div>
      <div className="dash">
        <nav className="dnav">
          {items.map(([id, label, icon]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{icon}{label}</button>
          ))}
        </nav>
        <div>
          {tab === "overview" && (
            <>
              {vm.plan ? (
                <div className="card" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", background: "var(--primary-soft)", border: "none" }}>
                  <div><span className="badge ok">Active plan</span><div style={{ fontFamily: "Bricolage Grotesque,sans-serif", fontWeight: 800, fontSize: "1.2rem", marginTop: 6 }}>{vm.plan.name} · Class {vm.plan.cls}</div></div>
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
                  )) : <p className="mut" style={{ marginTop: 8 }}>No courses yet. <Link href="/courses" style={{ color: "var(--primary)" }}>Browse courses →</Link></p>}
                </div>
                <div className="card"><h3 style={{ marginBottom: 6 }}>Recent activity</h3>
                  {vm.notifications.length ? vm.notifications.slice(0, 5).map((n, i) => (
                    <div className="list-row" key={i}><div className="ic"><CheckIcon size={16} /></div><div><div style={{ fontSize: ".88rem" }}>{n.body}</div><div className="mut" style={{ fontSize: ".76rem" }}>{timeAgo(n.at)}</div></div></div>
                  )) : <p className="mut" style={{ marginTop: 8 }}>No activity yet.</p>}
                </div>
              </div>
            </>
          )}
          {tab === "courses" && (
            vm.enrolled.length ? (
              <div className="grid two">{vm.enrolled.map((c) => (
                <Link key={c.id} href={`/courses/${c.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
                  <h3 style={{ fontSize: "1.05rem" }}>{c.title}</h3>
                  <div className="progress" style={{ margin: "12px 0 6px" }}><i style={{ width: c.pct + "%" }} /></div>
                  <div className="mut" style={{ fontSize: ".82rem" }}>{c.pct}% complete</div>
                </Link>
              ))}</div>
            ) : <div className="card" style={{ textAlign: "center" }}><p className="mut">No courses yet.</p><Link className="btn" href="/courses" style={{ marginTop: 14 }}>Browse courses</Link></div>
          )}
          {tab === "tests" && (
            vm.attempts.length ? (
              <div className="tbl-wrap"><table>
                <thead><tr><th>Test</th><th>Score</th><th>Correct</th><th>Wrong</th><th></th></tr></thead>
                <tbody>{vm.attempts.map((a) => (
                  <tr key={a.id}><td><b>{a.title}</b><div className="mut" style={{ fontSize: ".76rem" }}>{timeAgo(a.at)}</div></td><td className="tnum">{a.score}/{a.max}</td><td>{a.correct}</td><td>{a.wrong}</td><td><Link className="mini-btn" href={`/results/${a.id}`}>Analysis</Link></td></tr>
                ))}</tbody>
              </table></div>
            ) : <div className="card" style={{ textAlign: "center" }}><p className="mut">No tests attempted yet.</p><Link className="btn" href="/tests" style={{ marginTop: 14 }}>Take a test</Link></div>
          )}
          {tab === "live" && (
            <div className="card">
              {vm.upcoming.length ? vm.upcoming.map((u, i) => (
                <div className="list-row" key={i}><div className="ic"><LiveIcon size={17} /></div><div><div style={{ fontWeight: 600, fontSize: ".9rem" }}>{u.title}</div><div className="mut" style={{ fontSize: ".78rem" }}>{u.courseTitle ? u.courseTitle + " · " : ""}{new Date(u.when).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</div></div></div>
              )) : <p className="mut">No upcoming live classes from your enrolled courses.</p>}
            </div>
          )}
          {tab === "notif" && (
            <div className="card">
              {vm.notifications.length ? vm.notifications.map((n, i) => (
                <div className="list-row" key={i}><div className="ic"><BellIcon size={16} /></div><div><div style={{ fontSize: ".9rem" }}>{n.body}</div><div className="mut" style={{ fontSize: ".76rem" }}>{timeAgo(n.at)}</div></div></div>
              )) : <p className="mut">No notifications.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
