// Canonical PBMC cell-type palette (theme-agnostic) + Zod enum + API label → color resolution.

import { z } from "zod";

export const KnownCellTypeSchema = z.enum([
  "CD4 T",
  "CD8 T",
  "B",
  "NK",
  "Monocyte",
  "DC",
  "Platelet",
  "Megakaryocyte",
]);

export type KnownCellType = z.infer<typeof KnownCellTypeSchema>;

export const KNOWN_CELL_TYPES: readonly KnownCellType[] = [
  "CD4 T",
  "CD8 T",
  "B",
  "NK",
  "Monocyte",
  "DC",
  "Platelet",
  "Megakaryocyte",
] as const;

/** Distinct hues similar to typical UMAP / Scanpy-style PBMC plots (light reference screenshots). */
export const CELL_TYPE_COLORS = {
  "CD4 T": "#60a5fa",
  "CD8 T": "#22d3ee",
  B: "#a78bfa",
  NK: "#fb923c",
  Monocyte: "#4ade80",
  DC: "#f87171",
  Platelet: "#f472b6",
  Megakaryocyte: "#a855f7",
} as const satisfies Record<KnownCellType, string>;

const FALLBACK_COLOR = "#94a3b8";

/** Maps raw `cell_type` strings from parquets / API to canonical keys (PBMC + Wilk). */
const RAW_TO_CANONICAL: Record<string, KnownCellType> = {
  "CD4 T cells": "CD4 T",
  "CD8 T cells": "CD8 T",
  "B cells": "B",
  "NK cells": "NK",
  "CD14 Monocytes": "Monocyte",
  "CD16 Monocytes": "Monocyte",
  Monocytes: "Monocyte",
  "Dendritic cells": "DC",
  Platelets: "Platelet",
  "Dendritic cell": "DC",
  Megakaryocytes: "Megakaryocyte",
};

export function resolveCanonicalCellType(raw: string): KnownCellType | null {
  if (KnownCellTypeSchema.safeParse(raw).success) {
    return raw as KnownCellType;
  }
  const mapped = RAW_TO_CANONICAL[raw];
  return mapped ?? null;
}

export function colorForCellType(raw: string): string {
  const canon = resolveCanonicalCellType(raw);
  if (canon === null) {
    return FALLBACK_COLOR;
  }
  return CELL_TYPE_COLORS[canon];
}

export function labelForCanonical(canon: KnownCellType): string {
  const entry = Object.entries(RAW_TO_CANONICAL).find(([, v]) => v === canon);
  return entry !== undefined ? entry[0] : canon;
}

