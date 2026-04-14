// Zod schemas for GET /api/v1/embeddings responses (healthy reference UMAP points).

import { z } from "zod";

export const CellPointSchema = z.object({
  cell_id: z.string(),
  cell_type: z.string(),
  umap_1: z.number(),
  umap_2: z.number(),
});

export const EmbeddingResponseSchema = z.object({
  dataset: z.string(),
  model: z.string(),
  total_cells: z.number(),
  sampled: z.number(),
  source: z.enum(["s3", "local"]),
  cells: z.array(CellPointSchema),
});

export type CellPoint = z.infer<typeof CellPointSchema>;
export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>;
