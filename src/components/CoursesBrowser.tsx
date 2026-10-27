"use client";
import { useState } from "react";
import type { Course } from "@/lib/types";
import CourseCard from "@/components/CourseCard";

const CLASSES = ["8", "9", "10"];
const SUBJECTS = ["Mathematics", "Science", "Social Science", "English"];
const TYPES = ["Live", "Recorded", "Test Series"];

export default function CoursesBrowser({
  courses,
  initialSubject = "",
}: {
  courses: Course[];
  initialSubject?: string;
}) {
  const [f, setF] = useState({ cls: "", subject: initialSubject, type: "" });

  const list = courses.filter(
    (c) =>
      (!f.cls || String(c.class) === f.cls) &&
      (!f.subject || c.subject === f.subject) &&
      (!f.type || c.type === f.type)
  );

  function Group({ title, name, opts }: { title: string; name: keyof typeof f; opts: string[] }) {
    return (
      <div className="fgroup">
        <h4>{title}</h4>
        <div className="opts">
          <button className={"pill" + (f[name] === "" ? " on" : "")} onClick={() => setF({ ...f, [name]: "" })}>All</button>
          {opts.map((o) => (
            <button key={o} className={"pill" + (f[name] === o ? " on" : "")} onClick={() => setF({ ...f, [name]: o })}>{name === "cls" ? o + "th" : o}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="catalog">
      <aside className="filters">
        <Group title="Class" name="cls" opts={CLASSES} />
        <Group title="Subject" name="subject" opts={SUBJECTS} />
        <Group title="Type" name="type" opts={TYPES} />
        <div className="fgroup">
          <button className="btn ghost sm block" onClick={() => setF({ cls: "", subject: "", type: "" })}>Reset filters</button>
        </div>
      </aside>
      <div>
        <div className="mut" style={{ marginBottom: 14, fontSize: ".88rem" }}>
          {list.length} course{list.length !== 1 ? "s" : ""} found
        </div>
        {list.length ? (
          <div className="grid">{list.map((c) => <CourseCard key={c.id} course={c} />)}</div>
        ) : (
          <div className="card" style={{ textAlign: "center" }}><p className="mut">No courses match these filters. Try resetting.</p></div>
        )}
      </div>
    </div>
  );
}
