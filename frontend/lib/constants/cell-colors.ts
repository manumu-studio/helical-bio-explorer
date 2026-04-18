// Back-compat re-exports for cell-type colors (see `cellTypeColors.ts` for canonical palette).

export {
  CELL_TYPE_COLORS,
  colorForCellType as getCellColor,
} from "@/lib/constants/cellTypeColors";

export const FALLBACK_CELL_COLOR = "#94a3b8";
