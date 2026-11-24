import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteurl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl().origin;
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/firms`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
