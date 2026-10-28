"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser, setDemoUser } from "@/lib/clientState";

const LINKS = [
  ["/courses", "Courses"],
  ["/plans", "Plans"],
  ["/tests", "Test Series"],
  ["/dashboard", "Dashboard"],
  ["/about", "About"],
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        const u = data.user;
        setName(u ? (u.user_metadata?.full_name || u.user_metadata?.name || u.email || "Student") : null);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        const u = session?.user;
        setName(u ? (u.user_metadata?.full_name || u.user_metadata?.name || u.email || "Student") : null);
      });
      return () => sub.subscription.unsubscribe();
    } else {
      const u = getDemoUser();
      setName(u?.full_name || null);
    }
  }, [pathname]);

  async function logout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    else setDemoUser(null);
    setName(null);
    router.push("/");
    router.refresh();
  }


  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" href="/" aria-label="Suhana Education home">
          <img src="/suhana-logo.png" alt="Suhana Education" className="brand-logo" />
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={pathname.startsWith(href) ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          {name ? (
            <>
              <Link className="userchip" href="/dashboard">
                <span className="av">{name.slice(0, 1).toUpperCase()}</span>
                {name}
              </Link>
              <button className="btn sm ghost" onClick={logout}>Log out</button>
            </>
          ) : (
            <Link className="btn sm" href="/login">Student Portal</Link>
          )}
          <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={18} height={18}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid var(--line)", background: "var(--surface)", animation: "slideInDown .2s ease-out" }}>
          <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 2, paddingBlock: 12 }}>
            {LINKS.map(([href, label], i) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{ padding: "12px 8px", fontWeight: 600, color: "var(--muted)", borderRadius: "8px", transition: "all .2s", cursor: "pointer", animation: `fadeInUp .3s ease-out ${i * 50}ms backwards` }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--soft)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
