// Zod schemas for GET /api/v1/projections responses (disease cells in reference UMAP space).

import { z } from "zod";

import { CellPointSchema } from "@/lib/schemas/embeddings";

export const ProjectedCellSchema = CellPointSchema.extend({
  disease_activity: z.string(),
  distance_to_healthy: z.number(),
});

export const ProjectionResponseSchema = z.object({
  dataset: z.string(),
  model: z.string(),
  total_cells: z.number(),
  sampled: z.number(),
  source: z.enum(["s3", "local"]),
  cells: z.array(ProjectedCellSchema),
});

export type ProjectedCell = z.infer<typeof ProjectedCellSchema>;
export type ProjectionResponse = z.infer<typeof ProjectionResponseSchema>;
