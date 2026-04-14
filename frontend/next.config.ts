// Next.js configuration.
//
// Deployment target is Vercel — no `output: "standalone"` (that's for Docker self-hosting,
// and its artifact layout is not compatible with Vercel's build output contract).

import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

// Pin the tracing root to this app to avoid monorepo-detection warnings and bad traces
// when another pnpm lockfile exists outside this directory.
const tracingRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: tracingRoot,
};

export default nextConfig;
