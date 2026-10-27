"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getState, setState, getDemoUser, setDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { toast } from "@/components/toast";

const BOARD = "JKBOSE"; // J&K State Board — the only board this platform serves

export default function Onboarding({ courses }: { courses: { id: string; title: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) return toast("Please enter your name");
    if (!cls) return toast("Please select your class");
    setBusy(true);

    if (SUPABASE_CONFIGURED) {
      const supabase = createClient()!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      await supabase.from("profiles").update({
        full_name: name.trim(), class: Number(cls), target_exam: BOARD, onboarded: true,
      }).eq("id", user.id);
      if (courseId) await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    } else {
      setDemoUser({ ...(getDemoUser() || {}), full_name: name.trim(), class: Number(cls), target_exam: BOARD, onboarded: true });
      if (courseId) {
        const s = getState();
        if (!s.enrolled.includes(courseId)) { s.enrolled.push(courseId); setState(s); }
      }
    }
    setBusy(false);
    toast("Profile saved — welcome, " + name.trim() + "!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card">
      <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Set up your profile</h1>
      <p className="mut" style={{ marginBottom: 18 }}>You’re studying for the J&amp;K State Board (JKBOSE). Just pick your class to tailor your dashboard.</p>
      <div className="field"><label htmlFor="n">Full name</label><input className="input" id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
      <div className="field"><label htmlFor="c">Current class</label>
        <select className="select" id="c" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">Select</option>{[8, 9, 10].map((x) => <option key={x} value={x}>Class {x}</option>)}
        </select>
      </div>
      <div className="field"><label htmlFor="co">Enroll in a course (optional)</label>
        <select className="select" id="co" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Select later</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <button className="btn block" disabled={busy} onClick={save}>{busy ? "Saving…" : "Finish setup"}</button>
    </div>
  );
}
