import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lawgistics Marketing",
  description:
    "Draft one on-brand social graphic a week: describe the post, review the AI draft, download the slides.",
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
