import Link from "next/link";
import type { Course } from "@/lib/types";
import { SUBJECT_META, BookIcon, ClockIcon } from "@/components/icons";

function rupee(n: number) {
  return n > 0 ? "₹" + n.toLocaleString("en-IN") : "Free";
}

export default function CourseCard({ course }: { course: Course }) {
  const meta = SUBJECT_META[course.subject] ?? SUBJECT_META.Mathematics;
  const lectureCount = (course.chapters ?? []).reduce((s, c) => s + c.lectures.length, 0);
  const gid = "th-" + course.id;
  return (
    <Link className="pcard" href={`/courses/${course.id}`} style={{textDecoration: 'none'}}>
      <div className="pthumb">
        <svg className="bg" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={meta.c} />
              <stop offset="1" stopColor={meta.c2} />
            </linearGradient>
          </defs>
          <rect width="320" height="120" fill={`url(#${gid})`} />
          <circle cx="56" cy="34" r="44" fill="#fff" opacity=".08" />
          <circle cx="276" cy="104" r="56" fill="#fff" opacity=".06" />
        </svg>
        <span className="ico" style={{ color: "#fff" }}>
          <svg viewBox="0 0 24 24" fill="none" width={46} height={46} aria-hidden>{meta.path}</svg>
        </span>
        <span className="pbadge">{course.type}</span>
      </div>
      <div className="pbody">
        <div className="ptags">
          <span className="t">Class {course.class}</span>
          <span className="t">{course.exam}</span>
          <span className="t">{course.subject}</span>
        </div>
        <h3 style={{fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.25, marginBottom: 8}}>
          {course.title}
        </h3>
        <p className="desc" style={{fontSize: '.88rem', color: 'var(--muted)', marginBottom: 12}}>
          {(course.description ?? "").slice(0, 96)}
          {(course.description ?? "").length > 96 ? "…" : ""}
        </p>
        <div className="pmeta" style={{fontSize: '.82rem', gap: 14, marginBottom: 14}}>
          {lectureCount > 0 && (
            <span className="d" style={{display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)'}}><BookIcon size={14} />{lectureCount} lectures</span>
          )}
          <span className="d" style={{display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)'}}><ClockIcon size={14} />{course.teacher_name}</span>
        </div>
        <div className="pfoot">
          <div className="price">
            {course.price > 0 ? (
              <>
                <b style={{fontSize: '1.3rem', color: 'var(--primary)'}}>{rupee(course.price)}</b>
                {course.mrp > course.price && <s style={{color: 'var(--muted)', fontSize: '.85rem'}}>{rupee(course.mrp)}</s>}
              </>
            ) : (
              <span className="free" style={{fontWeight: 700}}>Free</span>
            )}
          </div>
          <span className="btn sm" style={{background: 'var(--primary)', color: '#fff'}}>View</span>
        </div>
      </div>
    </Link>
  );
}
