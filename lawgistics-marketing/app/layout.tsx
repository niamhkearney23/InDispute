import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lawgistics Marketing",
  description:
    "One idea in, a post worth publishing out. Describe it, review the draft, save the slides.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Lawgistics" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#08090B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
