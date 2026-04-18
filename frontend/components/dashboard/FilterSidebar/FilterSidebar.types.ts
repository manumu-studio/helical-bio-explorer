// Props for CELLxGENE-style left filter column (cell types, condition, divergence).

import type { DashboardTabId } from "@/components/DashboardShell/DashboardShell.types";
import type { KnownCellType } from "@/lib/constants/cellTypeColors";

export interface FilterSidebarProps {
  activeTab: DashboardTabId;
  datasetLabel: string;
  modelLabel: string;
  showModelToggle: boolean;
  modelName?: string;
  onModelChange?: (name: string) => void;
  /** Counts of cells per canonical type in the current view (for legend badges). */
  cellTypeCounts: Partial<Record<KnownCellType, number>>;
  showConditionFilter: boolean;
  showDivergenceSlider: boolean;
  divergenceSliderMin: number;
  divergenceSliderMax: number;
}
