"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import CourseCard from "@/components/CourseCard";
import { createClient } from "@/lib/supabase/client";
import { getState, getDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { PLAN_CLASSES } from "@/lib/plans";
import { BookIcon, SubjectGlyph, subjectClass } from "@/components/icons";

const SUBJECT_BLURB: Record<string, string> = {
  Mathematics: "Strong fundamentals through step-by-step lessons and plenty of practice.",
  Science: "Physics, chemistry and biology explained with clear diagrams and examples.",
  "Social Science": "History, geography, civics and economics, made simple and memorable.",
  English: "Grammar, writing skills, prose and poetry for confident communication.",
};
const TYPES = ["Live", "Recorded", "Test Series"];
const key = (courseId: string, lectureId: string) => courseId + "/" + lectureId;
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

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
    <div className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span className="sep" aria-hidden />Courses</nav>

      <div className="page-head">
        <div>
          <h1>Courses for Class {cls}</h1>
          <p>JKBOSE subjects taught chapter by chapter, with live classes, recorded lectures and practice. Choose your class to see what’s inside.</p>
        </div>
        <div className="seg" role="group" aria-label="Choose your class">
          {PLAN_CLASSES.map((c) => (
            <button key={c} type="button" aria-pressed={cls === c} onClick={() => setCls(c)}>Class {c}</button>
          ))}
        </div>
      </div>

      {ready && (authed ? (
        (continueList.length > 0 || upcomingLive.length > 0) && (
          <section className="cx-learning" aria-label="Your learning">
            {continueList.length > 0 && (
              <div className="panel cx-panel">
                <div className="cx-panel-h"><h3>Continue learning</h3><Link className="mini-btn" href="/dashboard">Open dashboard</Link></div>
                <div>
                  {continueList.map((c) => (
                    <Link key={c.id} href={`/courses/${c.id}`} className={"row-link " + subjectClass(c.subject)}>
                      <span className="sub-chip"><SubjectGlyph subject={c.subject} size={18} /></span>
                      <span className="rl-main"><span className="rl-title">{c.title}</span><span className="progress"><i style={{ width: c.pct + "%" }} /></span></span>
                      <span className="mut" style={{ fontSize: ".8125rem", minWidth: 36, textAlign: "right" }}>{c.pct}%</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {upcomingLive.length > 0 && (
              <div className="panel cx-panel">
                <div className="cx-panel-h"><h3>Upcoming live classes</h3></div>
                <div>
                  {upcomingLive.map((l) => (
                    <Link key={l.courseId + l.id} href={`/courses/${l.courseId}`} className="row-link">
                      <span className="dot-live" aria-hidden />
                      <span className="rl-main" style={{ gap: 2 }}><span className="rl-title">{l.title}</span><span className="rl-sub">{l.subject}, {when(l.when)}</span></span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )
      ) : (
        <section className="cx-signin">
          <p><b>Log in to pick up where you left off.</b> Resume lectures, join your live classes and see your progress.</p>
          <Link className="btn sm" href="/login">Log in or sign up</Link>
        </section>
      ))}

      <section className="cx-sec" aria-labelledby="cx-subj-h">
        <div className="cx-sec-h">
          <div>
            <h2 id="cx-subj-h">Subjects</h2>
            <p>JKBOSE 2026–27 syllabus for Class {cls}.</p>
          </div>
        </div>
        {subjects.length ? (
          <div className="cx-subjects">
            {subjects.map((s) => (
              <Link className={"subject-cover cover " + subjectClass(s.subject)} key={s.subject} href={s.href}>
                <div>
                  {s.liveCount > 0 && <span className="badge night" style={{ marginBottom: 14 }}>Includes live classes</span>}
                  <h3>{s.subject}</h3>
                  <p>{SUBJECT_BLURB[s.subject] ?? "Chapter-wise lessons and practice for your board exam."}</p>
                  {authed && s.done > 0 && (
                    <div className="sc-prog"><span className="progress"><i style={{ width: s.pct + "%" }} /></span><span>{s.pct}% done</span></div>
                  )}
                </div>
                <div className="sc-foot">
                  <span className="sc-stats">
                    <span>{s.chapters} chapter{s.chapters !== 1 ? "s" : ""}</span>
                    <span>{s.lectures} lecture{s.lectures !== 1 ? "s" : ""}</span>
                  </span>
                  <span className="sc-glyph"><SubjectGlyph subject={s.subject} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>Class {cls} content is on its way</h3>
            <p>Lessons for this class are being added. Choose another class above, or look at the plans to see what’s included.</p>
            <Link className="btn ghost" href="/plans">View plans</Link>
          </div>
        )}
      </section>

      {classCourses.length > 0 && (
        <section className="cx-sec" aria-labelledby="cx-all-h">
          <div className="cx-sec-h">
            <div>
              <h2 id="cx-all-h">All Class {cls} courses</h2>
              <p>{catalog.length} course{catalog.length !== 1 ? "s" : ""}{typeFilter ? `, ${typeFilter.toLowerCase()}` : ""}</p>
            </div>
            <div className="chips" role="group" aria-label="Filter by type">
              <button className={"pill" + (typeFilter === "" ? " on" : "")} aria-pressed={typeFilter === ""} onClick={() => setTypeFilter("")}>All</button>
              {TYPES.map((t) => (
                <button key={t} className={"pill" + (typeFilter === t ? " on" : "")} aria-pressed={typeFilter === t} onClick={() => setTypeFilter(t)}>{t}</button>
              ))}
            </div>
          </div>
          {catalog.length ? (
            <div className="grid">{catalog.map((c) => <CourseCard key={c.id} course={c} />)}</div>
          ) : (
            <div className="empty">
              <p>There are no {typeFilter.toLowerCase()} courses for Class {cls} yet.</p>
              <button className="btn ghost" onClick={() => setTypeFilter("")}>Show all courses</button>
            </div>
          )}
        </section>
      )}

      <section className="cx-plans">
        <p><b>Ready to enroll?</b> One plan covers every Class {cls} subject for the year.</p>
        <Link className="btn ghost" href={`/plans?class=${cls}`}><BookIcon size={18} />Compare Class {cls} plans</Link>
      </section>
    </div>
  );
}

