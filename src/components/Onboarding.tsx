"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser, setDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
import { toast } from "@/components/toast";

const BOARD = "JKBOSE"; // J&K State Board — the only board this platform serves

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(goToPlans: boolean) {
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
    } else {
      setDemoUser({ ...(getDemoUser() || {}), full_name: name.trim(), class: Number(cls), target_exam: BOARD, onboarded: true });
    }
    setBusy(false);
    toast("Profile saved — welcome, " + name.trim() + "!");
    router.push(goToPlans ? `/plans?class=${cls}` : "/dashboard");
    router.refresh();
  }

  return (
    <div className="card">
      <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Set up your profile</h1>
      <p className="mut" style={{ marginBottom: 18 }}>You’re studying for the J&amp;K State Board (JKBOSE). Tell us your class so we can tailor your dashboard and plans.</p>
      <div className="field"><label htmlFor="n">Full name</label><input className="input" id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
      <div className="field"><label htmlFor="c">Current class</label>
        <select className="select" id="c" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">Select</option>{[8, 9, 10].map((x) => <option key={x} value={x}>Class {x}</option>)}
        </select>
      </div>
      <button className="btn block" disabled={busy} onClick={() => save(true)}>{busy ? "Saving…" : "Finish & choose my plan →"}</button>
      <button className="btn ghost block" disabled={busy} onClick={() => save(false)} style={{ marginTop: 10 }}>Skip for now</button>
    </div>
  );
}
