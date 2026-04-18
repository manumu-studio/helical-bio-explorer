// Aggregates per-cell counts by canonical cell type for filter sidebar badges.

import type { KnownCellType } from "@/lib/constants/cellTypeColors";
import { resolveCanonicalCellType } from "@/lib/constants/cellTypeColors";

export function countCellsByCanonical(cells: readonly { cell_type: string }[]): Partial<Record<KnownCellType, number>> {
  const out: Partial<Record<KnownCellType, number>> = {};
  for (const c of cells) {
    const k = resolveCanonicalCellType(c.cell_type);
    if (k !== null) {
      out[k] = (out[k] ?? 0) + 1;
    }
  }
  return out;
}
