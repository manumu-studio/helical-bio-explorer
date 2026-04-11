// Next.js configuration: standalone output for Docker and small production images.

import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

// When another pnpm lockfile exists outside this app (e.g. in $HOME), Next would infer the wrong
// workspace root for standalone output tracing; pinning the root avoids that warning and bad traces.
const tracingRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: tracingRoot,
};

export default nextConfig;
