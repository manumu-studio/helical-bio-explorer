// Zod schema for the backend /health endpoint response; consumed by lib/fetcher.ts.

import { z } from "zod";

export const HealthSchema = z.object({ status: z.literal("ok") });
export type Health = z.infer<typeof HealthSchema>;
