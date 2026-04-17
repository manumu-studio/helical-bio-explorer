// Zod schema for GET /api/v1/provenance/{dataset}/{model} — mirrors backend ProvenanceResponse.

import { z } from "zod";

export const ProvenanceResponseSchema = z.object({
  dataset_slug: z.string(),
  model_name: z.string(),
  model_version: z.string(),
  git_sha: z.string(),
  created_at: z.string().refine((s) => Number.isFinite(Date.parse(s)), {
    message: "expected ISO-8601 datetime string",
  }),
  output_parquet_key: z.string(),
});

export type ProvenanceResponse = z.infer<typeof ProvenanceResponseSchema>;
