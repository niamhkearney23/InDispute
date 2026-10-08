import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // The default is 1MB, which is smaller than most of the PDFs a coach
      // posts and most of the drafts an intern hands in: the upload simply
      // failed with a bare server error. Vercel itself refuses a request
      // over about 4.5MB, so that is the real ceiling whatever this says;
      // the forms stop anything over 4MB before it is sent and say why.
      bodySizeLimit: '5mb',
    },
  },
  // Nothing else may show these pages inside a frame of its own. A framed
  // staff page is how somebody gets a coach to press "Confirm" or "Verify"
  // without knowing it; nothing legitimate embeds the app anywhere.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          // A file is what its type says, never sniffed into a script.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Other sites see where a visitor came from, not which page.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HTTPS only, from the first visit onwards.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // The microphone is for voice memos and recorded explanations on
          // these pages only; the camera and location are never used.
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
        ],
      },
      {
        // A cartoon opened on its own is an SVG document: nothing in it may
        // run or load anything. Listed after the rule above, so it wins.
        source: '/cartoon/:code*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
