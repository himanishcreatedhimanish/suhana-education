"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED, SITE_URL } from "@/lib/env";
import { toast } from "@/components/toast";
import { InfoIcon } from "@/components/icons";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const supabase = createClient();

  async function sendOtp() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) return toast("Enter a valid 10-digit number");
    if (!SUPABASE_CONFIGURED) {
      setOtpSent(true);
      toast("Demo OTP is 123456");
      return;
    }
    setBusy(true);
    const { error } = await supabase!.auth.signInWithOtp({ phone: "+91" + digits });
    setBusy(false);
    if (error) return toast(error.message);
    setOtpSent(true);
    toast("OTP sent");
  }

  async function verifyOtp() {
    if (!SUPABASE_CONFIGURED) {
      if (otp !== "123456") return toast("Demo OTP is 123456");
      setDemoUser({ full_name: "", onboarded: false });
      return router.push("/onboarding");
    }
    setBusy(true);
    const { error } = await supabase!.auth.verifyOtp({ phone: "+91" + phone.replace(/\D/g, ""), token: otp, type: "sms" });
    setBusy(false);
    if (error) return toast(error.message);
    router.push("/onboarding");
    router.refresh();
  }

  async function emailSignIn() {
    if (!/.+@.+\..+/.test(email)) return toast("Enter a valid email");
    if (password.length < 6) return toast("Password must be at least 6 characters");
    if (!SUPABASE_CONFIGURED) {
      setDemoUser({ full_name: "", onboarded: false });
      return router.push("/onboarding");
    }
    setBusy(true);
    // Try sign in, fall back to sign up.
    let { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) {
      const res = await supabase!.auth.signUp({ email, password, options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=/onboarding` } });
      error = res.error;
      if (!error) { setBusy(false); return toast("Check your email to confirm, then log in."); }
    }
    setBusy(false);
    if (error) return toast(error.message);
    router.push("/onboarding");
    router.refresh();
  }

  async function google() {
    if (!SUPABASE_CONFIGURED) {
      setDemoUser({ full_name: "", onboarded: false });
      return router.push("/onboarding");
    }
    await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent("/onboarding")}` },
    });
  }

  return (
    <div className="card">
      {!SUPABASE_CONFIGURED && (
        <div className="notice" style={{ marginBottom: 18 }}>
          <InfoIcon size={18} />
          <div><b>Demo mode.</b> Phone OTP and Google are simulated (OTP: <b>123456</b>). Configure Supabase Auth to enable real sign-in.</div>
        </div>
      )}
      <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Log in or sign up</h1>
      <p className="mut" style={{ marginBottom: 18 }}>Choose a method to continue.</p>

      <div className="seg">
        <button className={tab === "phone" ? "on" : ""} onClick={() => setTab("phone")}>Phone OTP</button>
        <button className={tab === "email" ? "on" : ""} onClick={() => setTab("email")}>Email</button>
      </div>

      <button className="gbtn" onClick={google}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.8 18.9 23 15.9 23 12.3z" /><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.7v3C3.6 21.3 7.5 24 12 24z" /><path fill="#FBBC05" d="M5.5 14.6a7.2 7.2 0 0 1 0-4.6v-3H1.7a12 12 0 0 0 0 10.6l3.8-3z" /><path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.6 2.7 1.7 6.6l3.8 3C6.4 6.8 9 4.8 12 4.8z" /></svg>
        Continue with Google
      </button>
      <div className="divider">or</div>

      {tab === "phone" ? (
        !otpSent ? (
          <>
            <div className="field"><label htmlFor="ph">Mobile number</label><input className="input" id="ph" type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <button className="btn block" disabled={busy} onClick={sendOtp}>Send OTP</button>
          </>
        ) : (
          <>
            <div className="field"><label htmlFor="otp">Enter OTP</label><input className="input" id="otp" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} /></div>
            <button className="btn block" disabled={busy} onClick={verifyOtp}>Verify &amp; continue</button>
          </>
        )
      ) : (
        <>
          <div className="field"><label htmlFor="em">Email</label><input className="input" id="em" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label htmlFor="pw">Password</label><input className="input" id="pw" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <button className="btn block" disabled={busy} onClick={emailSignIn}>Continue</button>
        </>
      )}
      <input type="hidden" value={next} readOnly />
    </div>
  );
}
