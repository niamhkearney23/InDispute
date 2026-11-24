import { ImageResponse } from "next/og";

export const alt = "Lawgistics Marketing. One idea in, a post worth publishing out.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The card shown when the link is shared. Plain on purpose: the brand colours of the app itself.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#08090B",
          color: "#F2EFE8",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#9AA3B5" }}>Lawgistics Marketing</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1.05, fontFamily: "serif" }}>
          <span>One idea in.</span>
          <span style={{ fontStyle: "italic", color: "#8EA4E6" }}>A post worth publishing out.</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#9AA3B5" }}>Posts and designed carousels for lawyers and law firms</div>
      </div>
    ),
    size,
  );
}
