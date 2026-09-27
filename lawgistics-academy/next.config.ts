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
        ],
      },
    ];
  },
};

export default nextConfig;
