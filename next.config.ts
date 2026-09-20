import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Off for fast local/on-device iteration. Flip back to `true` periodically —
  // especially after touching mount effects or sequence/unlock logic — to catch
  // double-invoke bugs (like the who-i-am unlock() call) before they ship invisibly.
  // Has no effect on Vercel/production builds regardless of this setting.
  reactStrictMode: false,
allowedDevOrigins: ['10.0.0.154'],
  // Serves standalone art-project pages from public/art/<slug>/index.html
  // at the clean URL /art/<slug>. Wildcarded, so new projects need no config change.
  async rewrites() {
    return [{ source: '/art/:slug', destination: '/art/:slug/index.html' }];
  },
};

export default nextConfig;
