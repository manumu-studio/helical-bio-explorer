// Root page: server component probes backend /health via Zod-validated fetch.

import { fetcher, FetchError } from "@/lib/fetcher";
import { HealthSchema } from "@/lib/schemas/health";

export default async function Page() {
  const base = process.env.BACKEND_URL ?? "http://localhost:8000";
  try {
    await fetcher(`${base}/health`, HealthSchema);
    return (
      <main>
        <h1>helical-bio-explorer</h1>
        <p>backend: ok</p>
      </main>
    );
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      return (
        <main>
          <h1>helical-bio-explorer</h1>
          <p>backend: error</p>
        </main>
      );
    }
    throw error;
  }
}
