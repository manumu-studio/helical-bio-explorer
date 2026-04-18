// Left column: dataset block, optional model toggle, cell-type legend, condition toggles, divergence range.

"use client";

import { useMemo } from "react";

import type { FilterSidebarProps } from "@/components/dashboard/FilterSidebar/FilterSidebar.types";
import { useFilterSidebar } from "@/components/dashboard/FilterSidebar/useFilterSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CELL_TYPE_COLORS,
  type KnownCellType,
  KNOWN_CELL_TYPES,
  labelForCanonical,
} from "@/lib/constants/cellTypeColors";
import type { ConditionId } from "@/lib/stores/useSelectionStore";
import { isCellTypeVisible } from "@/lib/stores/useSelectionStore";

const MODELS = [
  { id: "geneformer", label: "Geneformer" },
  { id: "genept", label: "GenePT" },
] as const;

export function FilterSidebar({
  activeTab,
  datasetLabel,
  modelLabel,
  showModelToggle,
  modelName,
  onModelChange,
  cellTypeCounts,
  showConditionFilter,
  showDivergenceSlider,
  divergenceSliderMin,
  divergenceSliderMax,
}: FilterSidebarProps) {
  const {
    activeCellTypes,
    toggleCellTypeRow,
    resetCellTypes,
    activeConditions,
    setActiveConditions,
    toggleCondition,
    divergenceRange,
    setDivergenceRange,
  } = useFilterSidebar();

  const countsByCanonical = useMemo(() => {
    const m = new Map<KnownCellType, number>();
    for (const t of KNOWN_CELL_TYPES) {
      m.set(t, cellTypeCounts[t] ?? 0);
    }
    return m;
  }, [cellTypeCounts]);

  const sliderStep =
    divergenceSliderMax - divergenceSliderMin > 0
      ? (divergenceSliderMax - divergenceSliderMin) / 200
      : 0.001;

  return (
    <aside
      className="hidden h-full min-h-0 flex-col gap-4 overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-card)] px-3 pb-3 pt-0 text-[var(--text-primary)] xl:flex"
      aria-label="Filters"
    >
      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-xs">
        <p className="font-semibold text-[var(--text-primary)]">View</p>
        <p className="mt-1 text-[var(--text-secondary)]">{datasetLabel}</p>
        <p className="mt-1 text-[var(--text-secondary)]">
          Model: <span className="text-[var(--text-primary)]">{modelLabel}</span>
        </p>
        <p className="mt-1 capitalize text-[var(--text-secondary)]">Tab: {activeTab}</p>
      </div>

      {showModelToggle && modelName !== undefined && onModelChange !== undefined ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Model
          </p>
          <div className="flex gap-2">
            {MODELS.map((m) => {
              const active = modelName === m.id;
              return (
                <Button
                  key={m.id}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onModelChange(m.id);
                  }}
                >
                  {m.label}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Cell types
          </p>
          <button
            type="button"
            onClick={resetCellTypes}
            className="text-xs text-[var(--accent-indigo)] hover:underline"
          >
            Reset
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {KNOWN_CELL_TYPES.map((canon) => {
            const visible = isCellTypeVisible(canon, activeCellTypes);
            const count = countsByCanonical.get(canon) ?? 0;
            return (
              <li key={canon}>
                <button
                  type="button"
                  onClick={(e) => {
                    toggleCellTypeRow(canon, e.shiftKey);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    visible ? "bg-transparent hover:bg-[var(--bg-elevated)]" : "opacity-40"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CELL_TYPE_COLORS[canon] }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate text-[var(--text-primary)]">
                    {labelForCanonical(canon)}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    {count}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {showConditionFilter ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Condition
          </p>
          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => toggleCondition("all")}>
              All
            </Button>
            <ToggleGroup
              type="multiple"
              value={activeConditions}
              onValueChange={(v: string[]) => {
                setActiveConditions(v as ConditionId[]);
              }}
            >
              <ToggleGroupItem value="healthy">Healthy</ToggleGroupItem>
              <ToggleGroupItem value="mild">Mild</ToggleGroupItem>
              <ToggleGroupItem value="severe">Severe</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
            Empty selection = all conditions.
          </p>
        </div>
      ) : null}

      {showDivergenceSlider ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Divergence range
          </p>
          <Slider
            min={divergenceSliderMin}
            max={divergenceSliderMax}
            step={sliderStep}
            value={[divergenceRange[0], divergenceRange[1]]}
            onValueChange={(v) => {
              if (v.length >= 2) {
                setDivergenceRange([v[0] ?? 0, v[1] ?? 1]);
              }
            }}
          />
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {divergenceRange[0].toFixed(4)} — {divergenceRange[1].toFixed(4)}
          </p>
        </div>
      ) : null}
    </aside>
  );
}
