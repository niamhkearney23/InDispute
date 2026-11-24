import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteurl";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl().origin;
  return {
    rules: [{ userAgent: "*", allow: ["/", "/firms"], disallow: ["/api/", "/join", "/team", "/owner"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
