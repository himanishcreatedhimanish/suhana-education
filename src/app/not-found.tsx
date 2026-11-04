import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="nf">
        <p className="code">Error 404</p>
        <h1>This page isn’t here.</h1>
        <p>The link may be old, or the course or test may have been removed. Try one of these instead.</p>
        <div className="acts">
          <Link className="btn" href="/courses">Browse courses</Link>
          <Link className="btn ghost" href="/plans">View plans</Link>
          <Link className="btn quiet" href="/">Go to the homepage</Link>
        </div>
      </div>
    </div>
  );
}
