// Next.js configuration.
// Deployment target: Vercel. The repo has a husky-only package.json at the root,
// which creates a second pnpm-lock.yaml outside this directory. Without an
// explicit outputFileTracingRoot, Next.js walks up and picks the repo root as
// the workspace root — which breaks Vercel's build-output manifest and causes
// every route to return edge-level NOT_FOUND. Pinning the tracing root to this
// directory keeps workspace detection scoped to the frontend.

import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "."),
};

export default nextConfig;
