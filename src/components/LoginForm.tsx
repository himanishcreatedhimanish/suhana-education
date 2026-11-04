"use client";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setDemoUser } from "@/lib/clientState";
import { SUPABASE_CONFIGURED } from "@/lib/env";
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

  // Returning (already-onboarded) students go straight to the dashboard;
  // new accounts go through onboarding first.
  async function routeAfterLogin() {
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) return router.push("/login");
    const { data: p } = await supabase!.from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
    router.push(p?.onboarded ? next : "/onboarding");
    router.refresh();
  }

  // Already logged in? Don't show sign-up — send them to their dashboard.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    supabase?.auth.getUser().then(({ data }) => { if (data.user) router.replace(next || "/dashboard"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendOtp() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) return toast("Enter your 10-digit mobile number");
    if (!SUPABASE_CONFIGURED) {
      setOtpSent(true);
      toast("Demo code: 123456");
      return;
    }
    setBusy(true);
    const { error } = await supabase!.auth.signInWithOtp({ phone: "+91" + digits });
    setBusy(false);
    if (error) return toast(error.message);
    setOtpSent(true);
    toast("Code sent to +91 " + digits);
  }

  async function verifyOtp() {
    if (!SUPABASE_CONFIGURED) {
      if (otp !== "123456") return toast("That code isn’t right. The demo code is 123456.");
      setDemoUser({ full_name: "", onboarded: false });
      return router.push("/onboarding");
    }
    setBusy(true);
    const { error } = await supabase!.auth.verifyOtp({ phone: "+91" + phone.replace(/\D/g, ""), token: otp, type: "sms" });
    setBusy(false);
    if (error) return toast(error.message);
    return routeAfterLogin();
  }

  async function emailSignIn() {
    if (!/.+@.+\..+/.test(email)) return toast("Enter a valid email address");
    if (password.length < 6) return toast("Use a password of at least 6 characters");
    if (!SUPABASE_CONFIGURED) {
      setDemoUser({ full_name: "", onboarded: false });
      return router.push("/onboarding");
    }
    setBusy(true);
    // Try sign in, fall back to sign up.
    let { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) {
      const res = await supabase!.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` } });
      error = res.error;
      if (!error) { setBusy(false); return toast("Check your inbox to confirm your email, then log in."); }
    }
    setBusy(false);
    if (error) return toast(error.message);
    return routeAfterLogin();
  }

  async function google() {
    if (!SUPABASE_CONFIGURED) {
      setDemoUser({ full_name: "", onboarded: false });
      return router.push("/onboarding");
    }
    await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/onboarding")}` },
    });
  }

  const submit = (fn: () => unknown) => (e: FormEvent) => { e.preventDefault(); if (!busy) fn(); };

  return (
    <div className="auth-form">
      <h1>Log in or create an account</h1>
      <p className="sub">New to Suhana? Your account is created when you verify.</p>

      {!SUPABASE_CONFIGURED && (
        <div className="notice" style={{ marginBottom: 20 }}>
          <InfoIcon size={18} />
          <div><b>Demo mode.</b> Phone and Google sign-in are simulated. Use the code <b>123456</b>.</div>
        </div>
      )}

      <button className="gbtn" type="button" onClick={google}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.8 18.9 23 15.9 23 12.3z" /><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H1.7v3C3.6 21.3 7.5 24 12 24z" /><path fill="#FBBC05" d="M5.5 14.6a7.2 7.2 0 0 1 0-4.6v-3H1.7a12 12 0 0 0 0 10.6l3.8-3z" /><path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.6 2.7 1.7 6.6l3.8 3C6.4 6.8 9 4.8 12 4.8z" /></svg>
        Continue with Google
      </button>
      <div className="divider">or</div>

      <div className="seg block" role="tablist" aria-label="Sign-in method" style={{ marginBottom: 20 }}>
        <button type="button" role="tab" aria-selected={tab === "phone"} onClick={() => setTab("phone")}>Mobile number</button>
        <button type="button" role="tab" aria-selected={tab === "email"} onClick={() => setTab("email")}>Email</button>
      </div>

      {tab === "phone" ? (
        !otpSent ? (
          <form onSubmit={submit(sendOtp)} noValidate>
            <div className="field">
              <label htmlFor="ph">Mobile number</label>
              <div className="input-prefix">
                <span>+91</span>
                <input className="input" id="ph" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <p className="hint">We’ll text you a 6-digit code.</p>
            </div>
            <button className="btn lg block" type="submit" disabled={busy}>{busy ? "Sending code…" : "Send code"}</button>
          </form>
        ) : (
          <form onSubmit={submit(verifyOtp)} noValidate>
            <div className="otp-sent">
              <span>Code sent to +91 {phone.replace(/\D/g, "")}</span>
              <button type="button" className="linklike" onClick={() => { setOtpSent(false); setOtp(""); }}>Change</button>
            </div>
            <div className="field">
              <label htmlFor="otp">Enter the 6-digit code</label>
              <input className="input otp-input" id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} autoFocus />
            </div>
            <button className="btn lg block" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify and continue"}</button>
            <p className="auth-fine">Didn’t get it? <button type="button" className="linklike" onClick={sendOtp} disabled={busy}>Send a new code</button></p>
          </form>
        )
      ) : (
        <form onSubmit={submit(emailSignIn)} noValidate>
          <div className="field"><label htmlFor="em">Email</label><input className="input" id="em" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label htmlFor="pw">Password</label><input className="input" id="pw" type="password" autoComplete="current-password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <button className="btn lg block" type="submit" disabled={busy}>{busy ? "Please wait…" : "Continue"}</button>
          <p className="auth-fine">If you don’t have an account yet, we’ll create one and email you a confirmation link.</p>
        </form>
      )}
      <input type="hidden" value={next} readOnly />
    </div>
  );
}
