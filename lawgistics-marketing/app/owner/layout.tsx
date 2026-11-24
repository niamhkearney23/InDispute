import type { Metadata } from "next";

// Not for search engines or link previews: it is behind a sign in or an owner key.
export const metadata: Metadata = {
  title: "Owner console, Lawgistics Marketing",
  robots: { index: false, follow: false },
  openGraph: { title: "Owner console, Lawgistics Marketing" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
