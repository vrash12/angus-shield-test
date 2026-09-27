import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep AGENTS.md exactly as written: stop `next dev` adding its own block.
  agentRules: false,
  poweredByHeader: false,
  // This folder is the app. Without this, a stray lockfile higher up the
  // disk can be mistaken for the workspace root.
  turbopack: { root: __dirname },
};

export default nextConfig;
