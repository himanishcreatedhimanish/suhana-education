import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import { CheckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log in or sign up — Suhana Education",
};

const AFTER: [string, string][] = [
  ["Your class timetable", "Live classes for your subjects, with join links when they start."],
  ["Lectures by chapter", "Recorded lessons organised by subject and chapter, with progress saved."],
  ["Tests and results", "Mock tests with instant scoring and subject-wise analysis."],
];

export default function LoginPage() {
  return (
    <div className="auth">
      <aside className="auth-side lattice">
        <div>
          <h2>Everything for your board year, in one place.</h2>
          <p className="lead">Sign in with your phone number, email or Google. New students set up their class in a minute.</p>
          <ul className="auth-list">
            {AFTER.map(([t, d]) => (
              <li key={t}><CheckIcon size={18} /><div><b>{t}</b><span>{d}</span></div></li>
            ))}
          </ul>
        </div>
        <small>For JKBOSE students in Classes 8, 9 and 10.</small>
      </aside>
      <div className="auth-main">
        <Suspense fallback={<div className="auth-form"><p className="mut">Loading…</p></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
