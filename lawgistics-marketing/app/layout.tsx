import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/siteurl";

const DESCRIPTION = "One idea in, a post worth publishing out. Describe it, review the draft, save the slides.";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "Lawgistics Marketing",
  description: DESCRIPTION,
  // what LinkedIn, Slack and iMessage show when the link is shared (the image is app/opengraph-image.tsx)
  openGraph: { title: "Lawgistics Marketing", description: DESCRIPTION, siteName: "Lawgistics Marketing", type: "website", locale: "en_AU" },
  twitter: { card: "summary_large_image", title: "Lawgistics Marketing", description: DESCRIPTION },
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
      <body>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
