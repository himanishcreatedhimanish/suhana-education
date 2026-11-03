"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser, setDemoUser } from "@/lib/clientState";
import { SunIcon, MoonIcon, MenuIcon, XIcon, ChevronIcon } from "@/components/icons";

const LINKS: [string, string][] = [
  ["/courses", "Courses"],
  ["/plans", "Plans"],
  ["/tests", "Test series"],
  ["/about", "About"],
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
    try {
      const stored = localStorage.getItem("suhana-theme");
      if (stored) document.documentElement.setAttribute("data-theme", stored);
      setDark(stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches));
    } catch {}
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    else setDemoUser(null);
    setName(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const isDark = cur === "dark" || (!cur && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("suhana-theme", next); } catch {}
    setDark(!isDark);
  }

  const links: [string, string][] = name ? [["/dashboard", "Dashboard"], ...LINKS] : LINKS;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const first = name ? name.split(/[\s@]/)[0] : "";

  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link className="brand" href="/" aria-label="Suhana Education home">
          <img src="/suhana-logo.png" alt="Suhana Education" className="brand-logo" width={109} height={30} />
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={isActive(href) ? "active" : ""} aria-current={isActive(href) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          <button className="icon-btn" onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"}>
            {dark ? <SunIcon size={19} /> : <MoonIcon size={19} />}
          </button>
          {name ? (
            <>
              <Link className="userchip hide-sm" href="/dashboard" title="Open your dashboard">
                <span className="av" aria-hidden>{name.slice(0, 1).toUpperCase()}</span>
                <span className="nm">{first}</span>
              </Link>
              <button className="btn sm quiet hide-sm" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link className="btn sm quiet hide-sm" href="/login">Log in</Link>
              <Link className="btn sm hide-sm" href="/plans">View plans</Link>
            </>
          )}
          <button className="icon-btn burger" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="nav-sheet">
            {open ? <XIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="nav-sheet" id="nav-sheet">
          <div className="wrap">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={"nl" + (isActive(href) ? " active" : "")} onClick={() => setOpen(false)}>
                {label}
                <ChevronIcon size={18} />
              </Link>
            ))}
            <div className="acts">
              {name ? (
                <button className="btn ghost block" onClick={logout}>Log out</button>
              ) : (
                <>
                  <Link className="btn block lg" href="/plans" onClick={() => setOpen(false)}>View plans</Link>
                  <Link className="btn ghost block lg" href="/login" onClick={() => setOpen(false)}>Log in or sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
