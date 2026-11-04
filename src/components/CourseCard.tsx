import Link from "next/link";
import type { Course } from "@/lib/types";
import { subjectClass } from "@/components/icons";

function rupee(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function CourseCard({ course }: { course: Course }) {
  const lectureCount = (course.chapters ?? []).reduce((s, c) => s + c.lectures.length, 0);
  const chapterCount = (course.chapters ?? []).length;
  const off = course.mrp > course.price && course.price > 0 ? Math.round((1 - course.price / course.mrp) * 100) : 0;
  return (
    <Link className="ccard" href={`/courses/${course.id}`}>
      <div className={"ccard-cover cover " + subjectClass(course.subject)}>
        <div className="cc-top">
          <span className={"cc-kind" + (course.type === "Live" ? " live" : "")}>{course.type}</span>
          <span className="cc-class">Class {course.class}</span>
        </div>
        <div className="cc-subject">{course.subject}</div>
      </div>
      <div className="ccard-body">
        <h3>{course.title}</h3>
        {course.description && (
          <p className="desc">
            {course.description.slice(0, 110)}
            {course.description.length > 110 ? "…" : ""}
          </p>
        )}
        <div className="meta">
          <span>{course.teacher_name}</span>
          {chapterCount > 0 && <span>{chapterCount} chapter{chapterCount !== 1 ? "s" : ""}</span>}
          {lectureCount > 0 && <span>{lectureCount} lecture{lectureCount !== 1 ? "s" : ""}</span>}
        </div>
        <div className="ccard-foot">
          <div className="price">
            {course.price > 0 ? (
              <>
                <b>{rupee(course.price)}</b>
                {course.mrp > course.price && <s>{rupee(course.mrp)}</s>}
                {off > 0 && <span className="off">{off}% off</span>}
              </>
            ) : (
              <span className="free">Free</span>
            )}
          </div>
          <span className="mini-btn" aria-hidden>View course</span>
        </div>
      </div>
    </Link>
  );
}
