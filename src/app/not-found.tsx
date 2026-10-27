import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page" style={{ textAlign: "center" }}>
      <div className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
        <h1 style={{ fontSize: "2rem" }}>Page not found</h1>
        <p className="mut" style={{ margin: "12px 0 20px" }}>The page you’re looking for doesn’t exist.</p>
        <Link className="btn" href="/">Back home</Link>
      </div>
    </div>
  );
}
