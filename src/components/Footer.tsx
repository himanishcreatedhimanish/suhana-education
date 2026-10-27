import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fcols">
          <div className="fbrand">
            <span className="brand">
              <svg className="logo" viewBox="0 0 40 40" fill="none" aria-hidden>
                <rect width="40" height="40" rx="11" fill="var(--primary)" />
                <path d="M20 9l9 5v7c0 5.5-4 9.5-9 11-5-1.5-9-5.5-9-11v-7l9-5Z" fill="#fff" />
                <path d="M15.5 20.2l3.4 3.3 6-6.4" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span style={{ color: "var(--on-navy)" }}>Suhana<small>Education</small></span>
            </span>
            <p>Live classes, recorded lectures and test series for the J&amp;K State Board (JKBOSE) — Classes 8 to 10.</p>
          </div>
          <div className="fcol">
            <h4>Learn</h4>
            <Link href="/plans">Plans &amp; pricing</Link>
            <Link href="/courses">All courses</Link>
            <Link href="/tests">Test series</Link>
            <Link href="/about">About</Link>
          </div>
          <div className="fcol">
            <h4>Platform</h4>
            <Link href="/dashboard">Student dashboard</Link>
            <Link href="/teacher">Teacher console</Link>
            <Link href="/admin">Admin console</Link>
          </div>
          <div className="fcol">
            <h4>Support</h4>
            <Link href="/">FAQs</Link>
            <Link href="/">Payment &amp; refunds</Link>
            <Link href="/">Privacy policy</Link>
            <Link href="/">Terms</Link>
          </div>
        </div>
        <div className="fbar">
          <span>© 2026 Suhana Education</span>
          <span>An initiative by SKIE Classes · Jammu &amp; Kashmir</span>
        </div>
      </div>
    </footer>
  );
}
