import Link from "next/link";

export default function Footer() {
  return (
    <footer className="foot lattice">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <img src="/suhana-logo-light.png" alt="Suhana Education" className="foot-logo" width={189} height={48} />
            <div>
              <p>
                Live classes, recorded lectures, study material and fortnightly exams for J&amp;K State Board
                students in Classes 8, 9 and 10.
              </p>
            </div>
          </div>
          <div className="foot-col">
            <h4>Learn</h4>
            <ul>
              <li><Link href="/courses">Courses</Link></li>
              <li><Link href="/tests">Test series</Link></li>
              <li><Link href="/plans">Plans and pricing</Link></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Students</h4>
            <ul>
              <li><Link href="/login">Log in or sign up</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/onboarding">Set up your profile</Link></li>
            </ul>
          </div>
          <div className="foot-col">
            <h4>Suhana</h4>
            <ul>
              <li><Link href="/about">About the programme</Link></li>
              <li><Link href="/about#free">Free for eligible students</Link></li>
              <li><Link href="/about#partners">Partners</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-bar">
          <span>© 2026 Suhana Education</span>
          <span>An initiative by SKIE Classes, Jammu and Kashmir</span>
        </div>
      </div>
    </footer>
  );
}
