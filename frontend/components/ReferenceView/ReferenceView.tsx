// View 1: healthy PBMC 3k UMAP reference — one trace per cell type, lasso selection, three-column shell.

"use client";

import { useMemo } from "react";
import type { Data } from "plotly.js";

import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { MobileFilterToolbar } from "@/components/dashboard/MobileFilterToolbar";
import { SelectedCellsPanel } from "@/components/dashboard/SelectedCellsPanel";
import type { SelectedCellsPanelRow } from "@/components/dashboard/SelectedCellsPanel/SelectedCellsPanel.types";
import { ChartSkeleton } from "@/components/ChartSkeleton";
import { DashboardEmptyState } from "@/components/DashboardEmptyState";
import type { ReferenceViewProps } from "@/components/ReferenceView/ReferenceView.types";
import { useReferenceView } from "@/components/ReferenceView/useReferenceView";
import { UmapScatter } from "@/components/UmapScatter";
import { countCellsByCanonical } from "@/lib/dashboard/cellCounts";
import {
  CELL_TYPE_COLORS,
  type KnownCellType,
  KNOWN_CELL_TYPES,
  resolveCanonicalCellType,
} from "@/lib/constants/cellTypeColors";
import { useSelectionStore } from "@/lib/stores/useSelectionStore";

const HEALTHY_GREY = "#94a3b8";

export function ReferenceView({ onSourceChange, modelName, onModelNameChange }: ReferenceViewProps) {
  const { setModelName, viewState, data, cellTypes, filteredCells, cellTypeCount } = useReferenceView(
    onSourceChange,
    modelName,
    onModelNameChange,
  );

  const selectedCellIds = useSelectionStore((s) => s.selectedCellIds);
  const setSelectedCellIds = useSelectionStore((s) => s.setSelectedCellIds);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const hoveredCellId = useSelectionStore((s) => s.hoveredCellId);

  const cellTypeCounts = useMemo(() => countCellsByCanonical(data?.cells ?? []), [data?.cells]);

  const detailRows: SelectedCellsPanelRow[] = useMemo(() => {
    if (filteredCells.length === 0 || selectedCellIds.length === 0) {
      return [];
    }
    const idSet = new Set(selectedCellIds);
    return filteredCells
      .filter((c) => idSet.has(c.cell_id))
      .map((c) => ({
        cell_id: c.cell_id,
        cell_type: c.cell_type,
        condition: null,
        divergence: null,
      }));
  }, [filteredCells, selectedCellIds]);

  const traces: Data[] = useMemo(() => {
    if (filteredCells.length === 0) {
      return [];
    }
    const byCanon = new Map<KnownCellType, typeof filteredCells>();
    const unknown: typeof filteredCells = [];
    for (const c of filteredCells) {
      const canon = resolveCanonicalCellType(c.cell_type);
      if (canon === null) {
        unknown.push(c);
        continue;
      }
      const list = byCanon.get(canon) ?? [];
      list.push(c);
      byCanon.set(canon, list);
    }
    const out: Data[] = [];
    for (const canon of KNOWN_CELL_TYPES) {
      const cells = byCanon.get(canon);
      if (cells === undefined || cells.length === 0) {
        continue;
      }
      const color = CELL_TYPE_COLORS[canon];
      out.push({
        type: "scattergl",
        mode: "markers",
        name: canon,
        x: cells.map((c) => c.umap_1),
        y: cells.map((c) => c.umap_2),
        text: cells.map((c) => c.cell_id),
        marker: {
          size: cells.map((c) => (hoveredCellId === c.cell_id ? 11 : 6)),
          color,
        },
        hovertemplate:
          `<b>%{text}</b><br>Type: ${canon}<br>Condition: —<br>Divergence: —<extra></extra>`,
      });
    }
    if (unknown.length > 0) {
      out.push({
        type: "scattergl",
        mode: "markers",
        name: "Other",
        x: unknown.map((c) => c.umap_1),
        y: unknown.map((c) => c.umap_2),
        text: unknown.map((c) => c.cell_id),
        marker: {
          size: unknown.map((c) => (hoveredCellId === c.cell_id ? 11 : 6)),
          color: HEALTHY_GREY,
        },
        hovertemplate: "<b>%{text}</b><extra></extra>",
      });
    }
    return out;
  }, [filteredCells, hoveredCellId]);

  const hasSelection = selectedCellIds.length > 0;

  return (
    <div
      className={`flex h-full min-h-0 w-full flex-1 flex-col xl:grid xl:grid-rows-[minmax(0,1fr)] xl:gap-0 ${hasSelection ? "xl:grid-cols-[240px_1fr_minmax(0,320px)]" : "xl:grid-cols-[240px_1fr]"}`}
    >
      <FilterSidebar
        activeTab="reference"
        datasetLabel="PBMC 3k (healthy reference)"
        modelLabel={modelName}
        showModelToggle
        modelName={modelName}
        onModelChange={setModelName}
        cellTypeCounts={cellTypeCounts}
        showConditionFilter={false}
        showDivergenceSlider={false}
        divergenceSliderMin={0}
        divergenceSliderMax={1}
      />

      <MobileFilterToolbar
        activeTab="reference"
        showModelToggle
        modelName={modelName}
        onModelChange={setModelName}
        cellTypeCounts={cellTypeCounts}
        showConditionFilter={false}
        showDivergenceSlider={false}
        divergenceSliderMin={0}
        divergenceSliderMax={1}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-col border-x border-[var(--border)] bg-[var(--bg-base)] px-2 pb-2 pt-0 xl:border-x">
        {viewState.status === "loading" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <ChartSkeleton variant="umap" />
          </div>
        ) : null}
        {viewState.status === "error" ? (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
            {viewState.message}
          </div>
        ) : null}
        {viewState.status === "not_found" ? (
          <DashboardEmptyState viewName="Reference" dataset="pbmc3k" model={modelName} />
        ) : null}
        {viewState.status === "ready" && data !== null && traces.length > 0 ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              <UmapScatter
                traces={traces}
                title={`Healthy reference (PBMC 3k) — ${data.model}`}
                xLabel="UMAP 1"
                yLabel="UMAP 2"
                onSelectedCellIds={setSelectedCellIds}
                onClearSelection={clearSelection}
              />
            </div>
            <div className="mt-2 flex shrink-0 flex-col gap-3 lg:flex-row lg:gap-4">
              <div
                className="min-w-[180px] rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-primary)]"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <p className="mb-2 font-medium">Stats</p>
                <ul className="space-y-1 text-[var(--text-secondary)]">
                  <li>Total cells: {data.total_cells.toLocaleString()}</li>
                  <li>Sampled: {data.sampled.toLocaleString()}</li>
                  <li>Cell types: {cellTypeCount}</li>
                  <li>Types in view: {cellTypes.length}</li>
                </ul>
              </div>
              <div
                className="flex-1 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <p className="mb-1 font-medium text-[var(--text-primary)]">What you&apos;re seeing</p>
                <p>
                  UMAP embedding of {data.sampled.toLocaleString()} healthy PBMCs
                  from the <strong className="text-[var(--text-primary)]">{data.model}</strong> foundation model.
                  Each dot is a single cell, colored by cell type.
                  Use lasso selection to inspect individual cells.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <SelectedCellsPanel rows={detailRows} />
    </div>
  );
}
