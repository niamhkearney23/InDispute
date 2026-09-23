import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // The default is 1MB, which is smaller than most of the PDFs a coach
      // posts and most of the drafts an intern hands in: the upload simply
      // failed with a bare server error. The bucket's own 20MB limit still
      // applies; this is room for one such file plus the rest of the form.
      bodySizeLimit: '25mb',
    },
  },
};

export default nextConfig;
