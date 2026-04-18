// Cell-type toggle helpers: empty activeCellTypes = all visible; non-empty = only those types.

import { useCallback } from "react";

import type { KnownCellType } from "@/lib/constants/cellTypeColors";
import { KNOWN_CELL_TYPES } from "@/lib/constants/cellTypeColors";
import type { ConditionId } from "@/lib/stores/useSelectionStore";
import { useSelectionStore } from "@/lib/stores/useSelectionStore";

export function useFilterSidebar() {
  const activeCellTypes = useSelectionStore((s) => s.activeCellTypes);
  const setActiveCellTypes = useSelectionStore((s) => s.setActiveCellTypes);
  const activeConditions = useSelectionStore((s) => s.activeConditions);
  const setActiveConditions = useSelectionStore((s) => s.setActiveConditions);
  const divergenceRange = useSelectionStore((s) => s.divergenceRange);
  const setDivergenceRange = useSelectionStore((s) => s.setDivergenceRange);

  const toggleCellTypeRow = useCallback(
    (canon: KnownCellType, shiftKey: boolean) => {
      if (shiftKey) {
        setActiveCellTypes([canon]);
        return;
      }
      if (activeCellTypes.length === 0) {
        setActiveCellTypes(KNOWN_CELL_TYPES.filter((t) => t !== canon));
        return;
      }
      if (activeCellTypes.includes(canon)) {
        const next = activeCellTypes.filter((t) => t !== canon);
        setActiveCellTypes(next.length === 0 ? [] : next);
        return;
      }
      const next = [...activeCellTypes, canon].sort((a, b) => a.localeCompare(b));
      if (next.length === KNOWN_CELL_TYPES.length) {
        setActiveCellTypes([]);
      } else {
        setActiveCellTypes(next);
      }
    },
    [activeCellTypes, setActiveCellTypes],
  );

  const resetCellTypes = useCallback(() => {
    setActiveCellTypes([]);
  }, [setActiveCellTypes]);

  const toggleCondition = useCallback(
    (id: ConditionId | "all") => {
      if (id === "all") {
        setActiveConditions([]);
        return;
      }
      const set = new Set(activeConditions);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      setActiveConditions([...set]);
    },
    [activeConditions, setActiveConditions],
  );

  return {
    activeCellTypes,
    toggleCellTypeRow,
    resetCellTypes,
    activeConditions,
    setActiveConditions,
    toggleCondition,
    divergenceRange,
    setDivergenceRange,
  };
}
