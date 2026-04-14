// Zod schemas for GET /api/v1/disagreement responses (cross-model disagreement per cell).

import { z } from "zod";

import { CellScoreSchema } from "@/lib/schemas/scores";

export const DisagreementCellSchema = CellScoreSchema.extend({
  disagreement: z.number(),
});

export const DisagreementResponseSchema = z.object({
  dataset: z.string(),
  total_cells: z.number(),
  sampled: z.number(),
  source: z.enum(["s3", "local"]),
  cells: z.array(DisagreementCellSchema),
});

export type DisagreementCell = z.infer<typeof DisagreementCellSchema>;
export type DisagreementResponse = z.infer<typeof DisagreementResponseSchema>;
