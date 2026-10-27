"use client";
import { useEffect, useState } from "react";
import type { Course, Test } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import * as store from "@/lib/adminStore";
import { toast } from "@/components/toast";
import { InfoIcon } from "@/components/icons";

const SUBJECTS = ["Mathematics", "Science", "Social Science", "English"];
const EXAMS = ["JKBOSE"];
const TYPES = ["Live", "Recorded", "Test Series"];
const CLASSES = [8, 9, 10];

type CourseRow = Course & { _lectures?: number };

export default function AdminConsole({ role }: { role: "teacher" | "admin" }) {
  const [tab, setTab] = useState<"courses" | "tests" | "students" | "analytics">("courses");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<store.DemoStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<React.ReactNode>(null);

  const supabase = SUPABASE_CONFIGURED ? createClient() : null;

  async function load() {
    setLoading(true);
    if (supabase) {
      const { data: cs } = await supabase.from("courses").select("id,title,class,exam,subject,type,teacher_name,price,mrp,description").order("created_at");
      setCourses(((cs ?? []) as any[]).map((c) => ({ ...c, chapters: [] })));
      const { data: ts } = await supabase.from("tests").select("id,title,exam,class,duration_min,marks_correct,marks_wrong").order("created_at");
      setTests(((ts ?? []) as any[]).map((t) => ({ ...t, questions: [] })));
      if (role === "admin") {
        const { data: ps } = await supabase.from("profiles").select("id,full_name,class,target_exam").eq("role", "student");
        setStudents(((ps ?? []) as any[]).map((p) => ({ id: p.id, name: p.full_name ?? "—", cls: p.class ?? 0, exam: p.target_exam ?? "—", enrolled: [] })));
      }
    } else {
      setCourses(store.getCourses().map((c) => ({ ...c })));
      setTests(store.getTests());
      setStudents(store.getStudents());
    }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // ---- course CRUD ----
  async function saveCourse(c: Partial<Course>, id?: string) {
    if (supabase) {
      if (id) await supabase.from("courses").update(c).eq("id", id);
      else await supabase.from("courses").insert(c as any);
    } else {
      const list = store.getCourses();
      if (id) { const i = list.findIndex((x) => x.id === id); if (i > -1) list[i] = { ...list[i], ...c } as Course; }
      else list.unshift({ id: "c" + Date.now(), chapters: [], ...(c as Course) });
      store.saveCourses(list);
    }
    setModal(null); toast(id ? "Course updated" : "Course created"); load();
  }
  async function deleteCourse(id: string) {
    if (supabase) await supabase.from("courses").delete().eq("id", id);
    else store.saveCourses(store.getCourses().filter((c) => c.id !== id));
    toast("Course deleted"); load();
  }

  // ---- test CRUD ----
  async function saveTest(t: Partial<Test>, id?: string) {
    if (supabase) {
      if (id) await supabase.from("tests").update(t).eq("id", id);
      else await supabase.from("tests").insert(t as any);
    } else {
      const list = store.getTests();
      if (id) { const i = list.findIndex((x) => x.id === id); if (i > -1) list[i] = { ...list[i], ...t } as Test; }
      else list.unshift({ id: "t" + Date.now(), questions: [], ...(t as Test) });
      store.saveTests(list);
    }
    setModal(null); toast(id ? "Test updated" : "Test created"); load();
  }
  async function deleteTest(id: string) {
    if (supabase) await supabase.from("tests").delete().eq("id", id);
    else store.saveTests(store.getTests().filter((t) => t.id !== id));
    toast("Test deleted"); load();
  }

  function courseForm(existing?: CourseRow) {
    let c: any = existing ?? { title: "", class: 9, exam: "JKBOSE", subject: "Mathematics", type: "Live", teacher_name: "", price: 0, mrp: 0, description: "" };
    const draft = { ...c };
    setModal(
      <Modal title={existing ? "Edit course" : "New course"} onClose={() => setModal(null)}>
        <Field label="Title" defaultValue={draft.title} onChange={(v) => (draft.title = v)} />
        <div className="form-row">
          <Select label="Class" opts={CLASSES.map(String)} value={String(draft.class)} onChange={(v) => (draft.class = Number(v))} />
          <Select label="Board" opts={EXAMS} value={draft.exam} onChange={(v) => (draft.exam = v)} />
        </div>
        <div className="form-row">
          <Select label="Subject" opts={SUBJECTS} value={draft.subject} onChange={(v) => (draft.subject = v)} />
          <Select label="Type" opts={TYPES} value={draft.type} onChange={(v) => (draft.type = v)} />
        </div>
        <Field label="Teacher (editable placeholder)" defaultValue={draft.teacher_name} onChange={(v) => (draft.teacher_name = v)} />
        <div className="form-row">
          <Field label="Price (₹, 0 = free)" type="number" defaultValue={String(draft.price)} onChange={(v) => (draft.price = Number(v) || 0)} />
          <Field label="MRP (₹)" type="number" defaultValue={String(draft.mrp)} onChange={(v) => (draft.mrp = Number(v) || 0)} />
        </div>
        <Field label="Description" textarea defaultValue={draft.description} onChange={(v) => (draft.description = v)} />
        <button className="btn block" onClick={() => {
          if (!draft.title?.trim()) return toast("Title required");
          const payload = { title: draft.title.trim(), class: draft.class, exam: draft.exam, subject: draft.subject, type: draft.type, teacher_name: draft.teacher_name?.trim() || "TBA", price: draft.price, mrp: draft.mrp, description: draft.description };
          saveCourse(payload, existing?.id);
        }}>{existing ? "Save changes" : "Create course"}</button>
      </Modal>
    );
  }

  function testForm(existing?: Test) {
    const draft: any = existing ? { ...existing } : { title: "", exam: "JKBOSE", class: 10, duration_min: 30, marks_correct: 4, marks_wrong: -1 };
    setModal(
      <Modal title={existing ? "Edit test" : "New test"} onClose={() => setModal(null)}>
        <Field label="Title" defaultValue={draft.title} onChange={(v) => (draft.title = v)} />
        <div className="form-row">
          <Select label="Board" opts={EXAMS} value={draft.exam} onChange={(v) => (draft.exam = v)} />
          <Select label="Class" opts={CLASSES.map(String)} value={String(draft.class)} onChange={(v) => (draft.class = Number(v))} />
        </div>
        <div className="form-row">
          <Field label="Duration (min)" type="number" defaultValue={String(draft.duration_min)} onChange={(v) => (draft.duration_min = Number(v) || 30)} />
          <Field label="Marks correct" type="number" defaultValue={String(draft.marks_correct)} onChange={(v) => (draft.marks_correct = Number(v) || 4)} />
        </div>
        <Field label="Marks wrong (negative)" type="number" defaultValue={String(draft.marks_wrong)} onChange={(v) => (draft.marks_wrong = Number(v) || 0)} />
        <button className="btn block" onClick={() => {
          if (!draft.title?.trim()) return toast("Title required");
          saveTest({ title: draft.title.trim(), exam: draft.exam, class: draft.class, duration_min: draft.duration_min, marks_correct: draft.marks_correct, marks_wrong: draft.marks_wrong }, existing?.id);
        }}>{existing ? "Save" : "Create test"}</button>
      </Modal>
    );
  }

  function addQuestion(test: Test) {
    setModal(
      <QuestionModal
        test={test}
        onClose={() => setModal(null)}
        onSave={async (q) => {
          if (supabase) {
            await supabase.from("questions").insert({ test_id: test.id, ...q });
          } else {
            const list = store.getTests();
            const i = list.findIndex((t) => t.id === test.id);
            if (i > -1) { list[i].questions.push({ id: "q" + Date.now(), ...(q as any) }); store.saveTests(list); }
          }
          setModal(null); toast("Question added"); load();
        }}
      />
    );
  }

  if (loading) return <div className="wrap page"><div className="card">Loading console…</div></div>;

  const items = role === "admin"
    ? [["courses", "Courses"], ["tests", "Tests & questions"], ["students", "Students"], ["analytics", "Analytics"]]
    : [["courses", "My courses"], ["tests", "Tests & questions"], ["analytics", "Analytics"]];

  return (
    <div className="wrap page">
      <div className="page-head">
        <div><div className="eyebrow">{role === "admin" ? "Admin console" : "Teacher console"}</div><h1>Manage {role === "admin" ? "the platform" : "your teaching"}</h1><p>Create, edit and delete content.</p></div>
      </div>
      <div className="notice" style={{ marginBottom: 20 }}>
        <InfoIcon size={18} />
        <div>{SUPABASE_CONFIGURED ? "Writes go to your Supabase database (RLS restricts this to teacher/admin accounts)." : "Demo mode: edits persist locally in this browser only and don't affect the server-rendered public pages. Configure Supabase for shared, persistent CRUD."}</div>
      </div>
      <div className="dash">
        <nav className="dnav">
          {items.map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id as any)}>{label}</button>
          ))}
        </nav>
        <div>
          {tab === "courses" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3>Courses ({courses.length})</h3>
                <button className="btn sm" onClick={() => courseForm()}>+ New course</button>
              </div>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Title</th><th>Class</th><th>Exam</th><th>Subject</th><th>Type</th><th>Teacher</th><th>Price</th><th></th></tr></thead>
                <tbody>{courses.map((c) => (
                  <tr key={c.id}><td><b>{c.title}</b></td><td>{c.class}</td><td>{c.exam}</td><td>{c.subject}</td><td>{c.type}</td><td>{c.teacher_name}</td><td>{c.price > 0 ? "₹" + c.price : "Free"}</td>
                    <td><div className="rowact"><button className="mini-btn" onClick={() => courseForm(c)}>Edit</button><button className="mini-btn del" onClick={() => deleteCourse(c.id)}>Delete</button></div></td>
                  </tr>
                ))}</tbody>
              </table></div>
            </>
          )}
          {tab === "tests" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3>Tests ({tests.length})</h3>
                <button className="btn sm" onClick={() => testForm()}>+ New test</button>
              </div>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Title</th><th>Exam</th><th>Class</th><th>Duration</th><th>Questions</th><th></th></tr></thead>
                <tbody>{tests.map((t) => (
                  <tr key={t.id}><td><b>{t.title}</b></td><td>{t.exam}</td><td>{t.class}</td><td>{t.duration_min} min</td><td>{t.questions.length || "—"}</td>
                    <td><div className="rowact"><button className="mini-btn" onClick={() => testForm(t)}>Edit</button><button className="mini-btn" onClick={() => addQuestion(t)}>+ Question</button><button className="mini-btn del" onClick={() => deleteTest(t.id)}>Delete</button></div></td>
                  </tr>
                ))}</tbody>
              </table></div>
            </>
          )}
          {tab === "students" && role === "admin" && (
            <>
              <h3 style={{ marginBottom: 16 }}>Students ({students.length})</h3>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Name</th><th>Class</th><th>Exam</th></tr></thead>
                <tbody>{students.length ? students.map((s) => (
                  <tr key={s.id}><td><b>{s.name}</b></td><td>{s.cls || "—"}</td><td>{s.exam}</td></tr>
                )) : <tr><td colSpan={3} className="mut">No students yet.</td></tr>}</tbody>
              </table></div>
            </>
          )}
          {tab === "analytics" && (
            <div className="stat-row">
              <div className="stat-c"><div className="n">{courses.length}</div><div className="l">Courses</div></div>
              <div className="stat-c"><div className="n">{tests.length}</div><div className="l">Tests</div></div>
              <div className="stat-c"><div className="n">{tests.reduce((s, t) => s + t.questions.length, 0)}</div><div className="l">Questions</div></div>
              <div className="stat-c"><div className="n">{students.length}</div><div className="l">Students</div></div>
            </div>
          )}
        </div>
      </div>
      {modal}
    </div>
  );
}

// ---- small form primitives ----
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3 style={{ marginBottom: 16 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
function Field({ label, defaultValue, onChange, type = "text", textarea }: { label: string; defaultValue?: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <div className="field">
      <label>{label}</label>
      {textarea
        ? <textarea className="input" rows={3} defaultValue={defaultValue} onChange={(e) => onChange(e.target.value)} />
        : <input className="input" type={type} defaultValue={defaultValue} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}
function Select({ label, opts, value, onChange }: { label: string; opts: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="select" defaultValue={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function QuestionModal({ test, onSave, onClose }: { test: Test; onSave: (q: any) => void; onClose: () => void }) {
  const [subject, setSubject] = useState("Mathematics");
  const [type, setType] = useState<"single" | "multi" | "numeric">("single");
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState<number[]>([]);
  const [num, setNum] = useState("");

  function submit() {
    if (!text.trim()) return toast("Question text required");
    let answer: any; let opts: string[] | null = null;
    if (type === "numeric") {
      if (num.trim() === "") return toast("Answer required");
      answer = parseFloat(num);
    } else {
      opts = options.map((o) => o.trim());
      if (opts.filter(Boolean).length < 2) return toast("Add at least 2 options");
      if (!correct.length) return toast("Mark the correct answer");
      answer = type === "multi" ? correct : correct[0];
    }
    onSave({ subject, type, text: text.trim(), options: opts, answer, marks: test.marks_correct });
  }

  return (
    <Modal title={`Add question — ${test.title}`} onClose={onClose}>
      <div className="form-row">
        <Select label="Subject" opts={SUBJECTS} value={subject} onChange={setSubject} />
        <Select label="Type" opts={["single", "multi", "numeric"]} value={type} onChange={(v) => setType(v as any)} />
      </div>
      <div className="field"><label>Question text</label><textarea className="input" rows={2} value={text} onChange={(e) => setText(e.target.value)} /></div>
      {type === "numeric" ? (
        <div className="field"><label>Correct numeric answer</label><input className="input" value={num} onChange={(e) => setNum(e.target.value)} /></div>
      ) : (
        <div className="field">
          <label>Options &amp; correct answer ({type === "multi" ? "tick all correct" : "tick one"})</label>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 8 }}>
              <input type={type === "multi" ? "checkbox" : "radio"} name="qc" checked={correct.includes(i)} onChange={() => {
                if (type === "multi") setCorrect((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
                else setCorrect([i]);
              }} />
              <input className="input" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={options[i]} onChange={(e) => setOptions((o) => { const n = [...o]; n[i] = e.target.value; return n; })} />
            </div>
          ))}
        </div>
      )}
      <button className="btn block" onClick={submit}>Add question</button>
    </Modal>
  );
}
