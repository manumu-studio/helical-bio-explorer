// Zod schemas for /api/datasets response — must stay in sync with backend/app/schemas/datasets.py.

import { z } from "zod";

export const DatasetSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  display_name: z.string().min(1),
  citation: z.string(),
  license: z.string(),
  cell_count: z.number().int().nonnegative(),
  gene_count: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
});

export const DatasetsResponseSchema = z.object({
  items: z.array(DatasetSchema),
  total: z.number().int().nonnegative(),
});

export type Dataset = z.infer<typeof DatasetSchema>;
export type DatasetsResponse = z.infer<typeof DatasetsResponseSchema>;
