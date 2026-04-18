// Compact horizontal filter row for mobile — replaces FilterSidebar on screens < xl.

"use client";

import { useMemo, useState } from "react";

import type { MobileFilterToolbarProps } from "@/components/dashboard/MobileFilterToolbar/MobileFilterToolbar.types";
import { useFilterSidebar } from "@/components/dashboard/FilterSidebar/useFilterSidebar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
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

const CONDITIONS: { id: ConditionId; label: string }[] = [
  { id: "healthy", label: "Healthy" },
  { id: "mild", label: "Mild" },
  { id: "severe", label: "Severe" },
];

export function MobileFilterToolbar({
  showModelToggle,
  modelName,
  onModelChange,
  cellTypeCounts,
  showConditionFilter,
  showDivergenceSlider,
  divergenceSliderMin,
  divergenceSliderMax,
}: MobileFilterToolbarProps) {
  const {
    activeCellTypes,
    toggleCellTypeRow,
    resetCellTypes,
    activeConditions,
    toggleCondition,
    divergenceRange,
    setDivergenceRange,
  } = useFilterSidebar();

  const [cellPopoverOpen, setCellPopoverOpen] = useState(false);

  const countsByCanonical = useMemo(() => {
    const m = new Map<KnownCellType, number>();
    for (const t of KNOWN_CELL_TYPES) {
      m.set(t, cellTypeCounts[t] ?? 0);
    }
    return m;
  }, [cellTypeCounts]);

  const activeCellCount =
    activeCellTypes.length === 0
      ? KNOWN_CELL_TYPES.length
      : activeCellTypes.length;

  const sliderStep =
    divergenceSliderMax - divergenceSliderMin > 0
      ? (divergenceSliderMax - divergenceSliderMin) / 200
      : 0.001;

  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden">
      {/* Model toggle */}
      {showModelToggle && modelName !== undefined && onModelChange !== undefined ? (
        <div className="flex shrink-0 gap-1">
          {MODELS.map((m) => (
            <Button
              key={m.id}
              type="button"
              variant={modelName === m.id ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onModelChange(m.id)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      ) : null}

      {/* Cell type popover */}
      <Popover open={cellPopoverOpen} onOpenChange={setCellPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 shrink-0 gap-1 px-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--accent-indigo)]"
              aria-hidden
            />
            Cells ({activeCellCount}/{KNOWN_CELL_TYPES.length})
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-2"
          align="start"
          sideOffset={4}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--text-secondary)]">Cell types</p>
            <button
              type="button"
              onClick={resetCellTypes}
              className="text-xs text-[var(--accent-indigo)] hover:underline"
            >
              Reset
            </button>
          </div>
          <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
            {KNOWN_CELL_TYPES.map((canon) => {
              const visible = isCellTypeVisible(canon, activeCellTypes);
              const count = countsByCanonical.get(canon) ?? 0;
              return (
                <li key={canon}>
                  <button
                    type="button"
                    onClick={() => toggleCellTypeRow(canon, false)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                      visible ? "hover:bg-[var(--bg-elevated)]" : "opacity-40"
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: CELL_TYPE_COLORS[canon] }}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{labelForCanonical(canon)}</span>
                    <span className="tabular-nums text-[var(--text-secondary)]">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Divergence slider inside popover */}
          {showDivergenceSlider ? (
            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <p className="mb-1 text-xs font-medium text-[var(--text-secondary)]">Divergence</p>
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
              <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
                {divergenceRange[0].toFixed(3)} — {divergenceRange[1].toFixed(3)}
              </p>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {/* Condition filter */}
      {showConditionFilter ? (
        <div className="flex shrink-0 gap-1">
          {CONDITIONS.map((c) => {
            const active =
              activeConditions.length === 0 || activeConditions.includes(c.id);
            return (
              <Button
                key={c.id}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => toggleCondition(c.id)}
              >
                {c.label}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
