// Zod schemas for GET /api/v1/scores responses (per-cell distances for both models).

import { z } from "zod";

export const CellScoreSchema = z.object({
  cell_id: z.string(),
  cell_type: z.string(),
  disease_activity: z.string(),
  distance_geneformer: z.number(),
  distance_genept: z.number(),
});

export const ScoresResponseSchema = z.object({
  dataset: z.string(),
  total_cells: z.number(),
  sampled: z.number(),
  source: z.enum(["s3", "local"]),
  cells: z.array(CellScoreSchema),
});

export type CellScore = z.infer<typeof CellScoreSchema>;
export type ScoresResponse = z.infer<typeof ScoresResponseSchema>;
