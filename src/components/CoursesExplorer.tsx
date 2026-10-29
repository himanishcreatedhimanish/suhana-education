"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import CourseCard from "@/components/CourseCard";
import { createClient } from "@/lib/supabase/client";
import { getState, getDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { PLAN_CLASSES } from "@/lib/plans";
import { SUBJECT_META, PlayIcon, LiveIcon, ClockIcon, CheckIcon, BookIcon } from "@/components/icons";

const SUBJECT_BLURB: Record<string, string> = {
  Mathematics: "Build strong fundamentals with step-by-step lessons and plenty of practice.",
  Science: "Physics, Chemistry and Biology explained with clear diagrams and examples.",
  "Social Science": "History, Geography, Civics and Economics made simple and memorable.",
  English: "Grammar, writing skills, prose and poetry for confident communication.",
};
const TYPES = ["Live", "Recorded", "Test Series"];
const key = (courseId: string, lectureId: string) => courseId + "/" + lectureId;

export default function CoursesExplorer({ courses, initialClass }: { courses: Course[]; initialClass: number }) {
  const [cls, setCls] = useState<number>(initialClass);
  const [authed, setAuthed] = useState(false);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        const supabase = createClient()!;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthed(true);
          const { data: profile } = await supabase.from("profiles").select("class").eq("id", user.id).maybeSingle();
          if (profile?.class && (PLAN_CLASSES as readonly number[]).includes(profile.class)) setCls(profile.class);
          const { data: enr } = await supabase.from("enrollments").select("course_id").eq("user_id", user.id);
          setEnrolled(new Set((enr ?? []).map((e: any) => e.course_id)));
        }
      } else {
        const u = getDemoUser();
        if (u && u.full_name) {
          setAuthed(true);
          if (u.class && (PLAN_CLASSES as readonly number[]).includes(u.class)) setCls(u.class);
          const s = getState();
          setEnrolled(new Set(s.enrolled));
          setProgress(new Set(Object.keys(s.progress).filter((k) => s.progress[k])));
        }
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classCourses = useMemo(() => courses.filter((c) => c.class === cls), [courses, cls]);

  // Group class courses into subjects with aggregated chapter / lecture / progress.
  const subjects = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const c of classCourses) {
      if (!map.has(c.subject)) map.set(c.subject, []);
      map.get(c.subject)!.push(c);
    }
    const order = ["Mathematics", "Science", "Social Science", "English"];
    const names = [...map.keys()].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return names.map((subject) => {
      const list = map.get(subject)!;
      let chapters = 0, lectures = 0, done = 0, liveCount = 0;
      for (const c of list) {
        chapters += c.chapters.length;
        for (const ch of c.chapters) for (const l of ch.lectures) {
          lectures++;
          if (l.type === "live") liveCount++;
          if (progress.has(key(c.id, l.id))) done++;
        }
      }
      return { subject, courses: list, chapters, lectures, liveCount, done, pct: lectures ? Math.round((done / lectures) * 100) : 0, href: `/courses/${list[0].id}` };
    });
  }, [classCourses, progress]);

  const upcomingLive = useMemo(() => {
    const out: { id: string; courseId: string; title: string; subject: string; when: string }[] = [];
    for (const c of classCourses) for (const ch of c.chapters) for (const l of ch.lectures) {
      if (l.type === "live" && l.scheduled_at) out.push({ id: l.id, courseId: c.id, title: l.title, subject: c.subject, when: l.scheduled_at });
    }
    return out.sort((a, b) => (a.when < b.when ? -1 : 1)).slice(0, 3);
  }, [classCourses]);

  const continueList = useMemo(() => {
    if (!authed) return [];
    return classCourses.filter((c) => enrolled.has(c.id)).map((c) => {
      let t = 0, d = 0;
      c.chapters.forEach((ch) => ch.lectures.forEach((l) => { t++; if (progress.has(key(c.id, l.id))) d++; }));
      return { id: c.id, title: c.title, subject: c.subject, pct: t ? Math.round((d / t) * 100) : 0 };
    }).slice(0, 4);
  }, [authed, classCourses, enrolled, progress]);

  const catalog = classCourses.filter((c) => !typeFilter || c.type === typeFilter);

  return (
    <div className="wrap page cx">
      <div className="crumbs"><Link href="/">Home</Link> › Courses</div>

      {/* hero */}
      <section className="cx-hero">
        <span className="eyebrow">Courses</span>
        <h1>What do you want to learn <span className="grad">today?</span></h1>
        <p className="cx-lead">Pick your class and dive into JKBOSE subjects — live classes, recorded lectures and chapter-wise practice, all in one place.</p>
        <div className="cx-classpick" role="tablist" aria-label="Select your class">
          <span className="cx-classpick-label">I'm in</span>
          {PLAN_CLASSES.map((c) => (
            <button key={c} role="tab" aria-selected={cls === c} className={"cx-class" + (cls === c ? " on" : "")} onClick={() => setCls(c)}>Class {c}</button>
          ))}
        </div>
      </section>

      {/* learning dashboard strip */}
      {ready && (authed ? (
        (continueList.length > 0 || upcomingLive.length > 0) && (
          <section className="cx-learning">
            {continueList.length > 0 && (
              <div className="cx-panel">
                <div className="cx-panel-h"><h3><PlayIcon size={17} />Continue learning</h3><Link className="mini-btn" href="/dashboard">Dashboard</Link></div>
                <div className="cx-continue">
                  {continueList.map((c) => (
                    <Link key={c.id} href={`/courses/${c.id}`} className="cx-continue-row">
                      <span className="cx-cic" style={gradStyle(c.subject)}><svg viewBox="0 0 24 24" width={18} height={18}>{(SUBJECT_META[c.subject] ?? SUBJECT_META.Mathematics).path}</svg></span>
                      <span className="cx-continue-main"><span className="cx-continue-title">{c.title}</span><span className="progress"><i style={{ width: c.pct + "%" }} /></span></span>
                      <span className="mut tnum" style={{ fontSize: ".8rem" }}>{c.pct}%</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {upcomingLive.length > 0 && (
              <div className="cx-panel">
                <div className="cx-panel-h"><h3><LiveIcon size={17} />Upcoming live classes</h3></div>
                <div className="cx-live-list">
                  {upcomingLive.map((l) => (
                    <Link key={l.courseId + l.id} href={`/courses/${l.courseId}`} className="cx-live-row">
                      <span className="cx-live-dot" />
                      <span className="cx-live-main"><span className="cx-live-title">{l.title}</span><span className="cx-live-when">{l.subject} · {new Date(l.when).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )
      ) : (
        <section className="cx-cta">
          <div><b>Log in to track your progress.</b><p className="mut">Sign in to resume lectures, join your live classes and see your completion — or keep exploring the subjects below.</p></div>
          <Link className="btn" href="/login">Log in / Sign up</Link>
        </section>
      ))}

      {/* subjects for selected class */}
      <section className="cx-sec">
        <div className="sec-head" style={{ textAlign: "left", margin: "0 0 18px" }}>
          <h2 style={{ fontSize: "1.5rem" }}>Subjects for Class {cls}</h2>
          <p style={{ marginTop: 6 }}>Explore each subject chapter by chapter. JKBOSE 2026–27 syllabus.</p>
        </div>
        {subjects.length ? (
          <div className="cx-subjects">
            {subjects.map((s) => {
              const meta = SUBJECT_META[s.subject] ?? SUBJECT_META.Mathematics;
              return (
                <div className="cx-subject" key={s.subject}>
                  <div className="cx-subject-top">
                    <span className="cx-subject-ic" style={gradStyle(s.subject)}><svg viewBox="0 0 24 24" width={24} height={24}>{meta.path}</svg></span>
                    {s.liveCount > 0 && <span className="badge live" style={{ marginLeft: "auto" }}>Live</span>}
                  </div>
                  <h3>{s.subject}</h3>
                  <p className="cx-subject-desc">{SUBJECT_BLURB[s.subject] ?? "Chapter-wise lessons and practice for your board exam."}</p>
                  <div className="cx-subject-meta">
                    <span><BookIcon size={14} />{s.chapters} chapter{s.chapters !== 1 ? "s" : ""}</span>
                    <span><PlayIcon size={14} />{s.lectures} lecture{s.lectures !== 1 ? "s" : ""}</span>
                  </div>
                  {authed && s.done > 0 && (
                    <div className="cx-subject-prog"><span className="progress"><i style={{ width: s.pct + "%" }} /></span><span className="mut tnum" style={{ fontSize: ".76rem" }}>{s.pct}%</span></div>
                  )}
                  <Link className="btn block sm" href={s.href}>{authed && s.done > 0 ? "Continue learning" : "Explore subject"} →</Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center" }}><p className="mut">Content for Class {cls} is being added. Try another class above, or <Link href="/plans" style={{ color: "var(--primary)", fontWeight: 600 }}>view plans</Link>.</p></div>
        )}
      </section>

      {/* browse all courses with content-type filter */}
      {classCourses.length > 0 && (
        <section className="cx-sec">
          <div className="cx-browse-h">
            <h2 style={{ fontSize: "1.3rem" }}>Browse all Class {cls} courses</h2>
            <div className="cx-typefilter">
              <button className={"pill" + (typeFilter === "" ? " on" : "")} onClick={() => setTypeFilter("")}>All</button>
              {TYPES.map((t) => (
                <button key={t} className={"pill" + (typeFilter === t ? " on" : "")} onClick={() => setTypeFilter(t)}>{t}</button>
              ))}
            </div>
          </div>
          {catalog.length ? (
            <div className="grid">{catalog.map((c) => <CourseCard key={c.id} course={c} />)}</div>
          ) : (
            <div className="card" style={{ textAlign: "center" }}><p className="mut">No {typeFilter} courses for Class {cls}. <button className="linklike" onClick={() => setTypeFilter("")}>Show all</button></p></div>
          )}
        </section>
      )}

      {/* soft pointer to plans (not pricing cards) */}
      <section className="cx-plans-note">
        <div><b>Ready to enrol?</b><span className="mut"> Compare Base, Rise and Elite plans and subscribe for Class {cls}.</span></div>
        <Link className="btn ghost" href={`/plans?class=${cls}`}>View plans &amp; pricing →</Link>
      </section>
    </div>
  );
}

function gradStyle(subject: string) {
  const m = SUBJECT_META[subject] ?? SUBJECT_META.Mathematics;
  return { background: `linear-gradient(135deg, ${m.c}, ${m.c2})`, color: "#fff" } as const;
}
