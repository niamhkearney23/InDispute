import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lawgistics Marketing",
  description:
    "Draft one on-brand social graphic a day: describe the post, review the AI draft, download the slides.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
