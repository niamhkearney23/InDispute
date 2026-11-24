// The public address of this deployment, for link previews, the sitemap and robots.txt.
// APP_URL wins (set it to your own domain). On Vercel the production address is used
// otherwise, and a local address when running on a laptop.
export function siteUrl(): URL {
  const explicit = (process.env.APP_URL || "").trim().replace(/\/+$/, "");
  const vercel = (process.env.VERCEL_PROJECT_PRODUCTION_URL || "").trim();
  const raw = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}
