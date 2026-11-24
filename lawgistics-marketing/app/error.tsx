"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "96px 20px" }}>
      <p className="hint" style={{ marginBottom: 12 }}>
        Lawgistics Marketing
      </p>
      <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "0 0 12px" }}>Something went wrong on our side.</h1>
      <p style={{ margin: "0 0 24px", color: "var(--ink-soft)" }}>Try again. If it keeps happening, reload the page.</p>
      <button className="btn btn-accent" type="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
