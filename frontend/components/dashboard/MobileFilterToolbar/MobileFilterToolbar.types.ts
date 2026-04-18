// Props for the compact mobile filter toolbar (replaces FilterSidebar on small screens).

import type { DashboardTabId } from "@/components/DashboardShell/DashboardShell.types";
import type { KnownCellType } from "@/lib/constants/cellTypeColors";

export interface MobileFilterToolbarProps {
  activeTab: DashboardTabId;
  showModelToggle: boolean;
  modelName?: string;
  onModelChange?: (name: string) => void;
  cellTypeCounts: Partial<Record<KnownCellType, number>>;
  showConditionFilter: boolean;
  showDivergenceSlider: boolean;
  divergenceSliderMin: number;
  divergenceSliderMax: number;
}
