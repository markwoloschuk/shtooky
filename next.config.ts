import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Off for fast local/on-device iteration. Flip back to `true` periodically —
  // especially after touching mount effects or sequence/unlock logic — to catch
  // double-invoke bugs (like the who-i-am unlock() call) before they ship invisibly.
  // Has no effect on Vercel/production builds regardless of this setting.
  reactStrictMode: false,
allowedDevOrigins: ['10.0.0.154'],
};

export default nextConfig;
