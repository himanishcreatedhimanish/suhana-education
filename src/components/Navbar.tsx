"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser, setDemoUser } from "@/lib/clientState";
import { SunIcon, MoonIcon } from "@/components/icons";

const LINKS = [
  ["/plans", "Plans"],
  ["/courses", "Courses"],
  ["/tests", "Test Series"],
  ["/dashboard", "Dashboard"],
  ["/about", "About"],
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    // theme
    try {
      const stored = localStorage.getItem("suhana-theme");
      if (stored) document.documentElement.setAttribute("data-theme", stored);
      setDark(
        stored === "dark" ||
          (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    } catch {}
    // auth state
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

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const isDark = cur === "dark" || (!cur && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("suhana-theme", next); } catch {}
    setDark(!isDark);
  }

  async function logout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    else setDemoUser(null);
    setName(null);
    router.push("/");
    router.refresh();
  }

  const Logo = (
    <svg className="logo" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="11" fill="var(--primary)" />
      <path d="M20 9l9 5v7c0 5.5-4 9.5-9 11-5-1.5-9-5.5-9-11v-7l9-5Z" fill="#fff" />
      <path d="M15.5 20.2l3.4 3.3 6-6.4" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" href="/">
          {Logo}
          <span>Suhana<small>Education</small></span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={pathname.startsWith(href) ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
          {name ? (
            <>
              <Link className="userchip" href="/dashboard">
                <span className="av">{name.slice(0, 1).toUpperCase()}</span>
                {name}
              </Link>
              <button className="btn sm ghost" onClick={logout}>Log out</button>
            </>
          ) : (
            <Link className="btn sm" href="/login">Log in / Sign up</Link>
          )}
          <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={18} height={18}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
          <div className="wrap" style={{ display: "flex", flexDirection: "column", gap: 2, paddingBlock: 12 }}>
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{ padding: "10px 4px", fontWeight: 600, color: "var(--muted)" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
