import type { NextConfig } from "next";

// Sent with every response. The Content Security Policy is set per request
// in src/proxy.ts, because it carries a fresh nonce each time.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Keep AGENTS.md exactly as written: stop `next dev` adding its own block.
  agentRules: false,
  poweredByHeader: false,
  // This folder is the app. Without this, a stray lockfile higher up the
  // disk can be mistaken for the workspace root.
  turbopack: { root: __dirname },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
