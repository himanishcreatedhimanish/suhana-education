"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser, setDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { toast } from "@/components/toast";

const BOARD = "JKBOSE"; // J&K State Board — the only board this platform serves
const CLASS_NOTE: Record<number, string> = { 8: "Middle school", 9: "Secondary", 10: "Board year" };

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(goToPlans: boolean) {
    if (!name.trim()) return toast("Enter your full name");
    if (!cls) return toast("Choose your class");
    setBusy(true);

    if (SUPABASE_CONFIGURED) {
      const supabase = createClient()!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      await supabase.from("profiles").update({
        full_name: name.trim(), class: Number(cls), target_exam: BOARD, onboarded: true,
      }).eq("id", user.id);
    } else {
      setDemoUser({ ...(getDemoUser() || {}), full_name: name.trim(), class: Number(cls), target_exam: BOARD, onboarded: true });
    }
    setBusy(false);
    toast("Profile saved. Welcome, " + name.trim().split(" ")[0] + ".");
    router.push(goToPlans ? `/plans?class=${cls}` : "/dashboard");
    router.refresh();
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); if (!busy) save(true); }

  return (
    <form className="onb" onSubmit={onSubmit} noValidate>
      <h1 style={{ fontSize: "clamp(1.75rem, 1.5rem + 1vw, 2.25rem)" }}>Set up your profile</h1>
      <p style={{ color: "var(--ink-2)", margin: "10px 0 28px" }}>
        Suhana teaches the J&amp;K State Board (JKBOSE) syllabus. Tell us your class and we’ll set up your timetable, lectures and plans to match.
      </p>
      <div className="field">
        <label htmlFor="n">Full name</label>
        <input className="input" id="n" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it should appear on your profile" />
      </div>
      <div className="field" role="group" aria-labelledby="cls-label">
        <span className="label" id="cls-label">Your class</span>
        <div className="class-pick">
          {[8, 9, 10].map((x) => (
            <button key={x} type="button" aria-pressed={cls === String(x)} onClick={() => setCls(String(x))}>
              <b>{x}</b>
              <span>{CLASS_NOTE[x]}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gap: 10, marginTop: 28 }}>
        <button className="btn lg block" type="submit" disabled={busy}>{busy ? "Saving…" : "Save and choose a plan"}</button>
        <button className="btn ghost lg block" type="button" disabled={busy} onClick={() => save(false)}>Save and go to my dashboard</button>
      </div>
    </form>
  );
}
