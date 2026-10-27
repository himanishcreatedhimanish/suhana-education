import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="wrap page" style={{ maxWidth: 520 }}>
      <Suspense fallback={<div className="card">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
