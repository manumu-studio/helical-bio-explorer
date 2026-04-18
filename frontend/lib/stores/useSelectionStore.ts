// Global Zustand store: lasso selection, hover, cell-type / condition / divergence filters.

import { create } from "zustand";

import type { KnownCellType } from "@/lib/constants/cellTypeColors";

export type ConditionId = "healthy" | "mild" | "severe";

export interface SelectionState {
  selectedCellIds: string[];
  hoveredCellId: string | null;
  /** Empty = all canonical types visible; otherwise only listed types. */
  activeCellTypes: KnownCellType[];
  /** Empty = all conditions pass; otherwise only listed. */
  activeConditions: ConditionId[];
  divergenceRange: [number, number];
  setSelectedCellIds: (ids: string[]) => void;
  setHoveredCellId: (id: string | null) => void;
  setActiveCellTypes: (types: KnownCellType[]) => void;
  setActiveConditions: (conds: ConditionId[]) => void;
  setDivergenceRange: (range: [number, number]) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedCellIds: [],
  hoveredCellId: null,
  activeCellTypes: [],
  activeConditions: [],
  divergenceRange: [0, 1],
  setSelectedCellIds: (ids) => {
    set({ selectedCellIds: ids });
  },
  setHoveredCellId: (id) => {
    set({ hoveredCellId: id });
  },
  setActiveCellTypes: (types) => {
    set({ activeCellTypes: types });
  },
  setActiveConditions: (conds) => {
    set({ activeConditions: conds });
  },
  setDivergenceRange: (range) => {
    set({ divergenceRange: range });
  },
  clearSelection: () => {
    set({ selectedCellIds: [], hoveredCellId: null });
  },
}));

export function isCellTypeVisible(canon: KnownCellType, active: KnownCellType[]): boolean {
  if (active.length === 0) {
    return true;
  }
  return active.includes(canon);
}

export function isConditionVisible(activity: string, active: ConditionId[]): boolean {
  if (active.length === 0) {
    return true;
  }
  const normalized = activity.toLowerCase();
  if (normalized === "low") {
    return active.includes("mild");
  }
  if (normalized === "high") {
    return active.includes("severe");
  }
  if (normalized === "healthy" || normalized === "mild" || normalized === "severe") {
    return active.includes(normalized as ConditionId);
  }
  return true;
}
