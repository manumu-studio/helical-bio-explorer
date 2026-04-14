// Maps PBMC cell-type labels to hex colors for consistent Plotly traces across dashboard views.

const CELL_TYPE_COLORS: Record<string, string> = {
  "CD4 T cells": "#60a5fa",
  "CD8 T cells": "#22d3ee",
  "B cells": "#4ade80",
  "NK cells": "#fb923c",
  "CD14 Monocytes": "#f87171",
  "CD16 Monocytes": "#f472b6",
  "Dendritic cells": "#a78bfa",
};

const FALLBACK_CELL_COLOR = "#94a3b8";

export function getCellColor(cellType: string): string {
  return CELL_TYPE_COLORS[cellType] ?? FALLBACK_CELL_COLOR;
}

export { CELL_TYPE_COLORS, FALLBACK_CELL_COLOR };
