// Zod schemas for GET /api/v1/summary responses (aggregated distance and disagreement stats).

import { z } from "zod";

export const CellTypeSummarySchema = z.object({
  cell_type: z.string(),
  disease_activity: z.string(),
  count: z.number(),
  mean_distance_geneformer: z.number(),
  std_distance_geneformer: z.number(),
  mean_distance_genept: z.number(),
  std_distance_genept: z.number(),
  mean_disagreement: z.number(),
  std_disagreement: z.number(),
});

export const SummaryResponseSchema = z.object({
  dataset: z.string(),
  source: z.enum(["s3", "local"]),
  groups: z.array(CellTypeSummarySchema),
});

export type CellTypeSummary = z.infer<typeof CellTypeSummarySchema>;
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;
