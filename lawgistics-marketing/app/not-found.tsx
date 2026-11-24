import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "96px 20px", textAlign: "left" }}>
      <p className="hint" style={{ marginBottom: 12 }}>
        Lawgistics Marketing
      </p>
      <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "0 0 12px" }}>That page does not exist.</h1>
      <p style={{ margin: "0 0 24px", color: "var(--ink-soft)" }}>The link may be old or mistyped. Your posts are not affected.</p>
      <Link className="btn btn-accent" href="/">
        Go to the studio
      </Link>
    </div>
  );
}
