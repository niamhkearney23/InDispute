import type { NextConfig } from "next";

// Headers that cost nothing and block whole classes of trouble: nobody can put /team or /owner in
// a frame to trick a click, browsers do not guess content types, and the page cannot be turned
// into a form that posts elsewhere. A script policy would need a nonce per request for Next's own
// inline scripts, so it is left out rather than shipped in a form that does nothing.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
