// View 1: healthy PBMC 3k UMAP reference, colored by cell type, per-model fetch.

"use client";

import { useMemo } from "react";
import type { Data } from "plotly.js";

import { ChartSkeleton } from "@/components/ChartSkeleton";
import { DashboardEmptyState } from "@/components/DashboardEmptyState";
import { FilterPanel } from "@/components/FilterPanel";
import type { ReferenceViewProps } from "@/components/ReferenceView/ReferenceView.types";
import { useReferenceView } from "@/components/ReferenceView/useReferenceView";
import { UmapScatter } from "@/components/UmapScatter";
import { getCellColor } from "@/lib/constants/cell-colors";

export function ReferenceView({ onSourceChange, modelName, onModelNameChange }: ReferenceViewProps) {
  const {
    setModelName,
    selectedCellType,
    setSelectedCellType,
    viewState,
    data,
    cellTypes,
    filteredCells,
    cellTypeCount,
  } = useReferenceView(onSourceChange, modelName, onModelNameChange);

  const traces: Data[] = useMemo(() => {
    if (filteredCells.length === 0) {
      return [];
    }
    return [
      {
        type: "scattergl",
        mode: "markers",
        name: "Cells",
        x: filteredCells.map((c) => c.umap_1),
        y: filteredCells.map((c) => c.umap_2),
        marker: {
          size: 6,
          color: filteredCells.map((c) => getCellColor(c.cell_type)),
        },
        text: filteredCells.map((c) => `${c.cell_id}<br>${c.cell_type}`),
        hoverinfo: "text",
      },
    ];
  }, [filteredCells]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        {viewState.status === "loading" ? <ChartSkeleton variant="umap" /> : null}
        {viewState.status === "error" ? (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
            {viewState.message}
          </div>
        ) : null}
        {viewState.status === "not_found" ? (
          <DashboardEmptyState viewName="Reference" dataset="pbmc3k" model={modelName} />
        ) : null}
        {viewState.status === "ready" && data !== null ? (
          <UmapScatter
            traces={traces}
            title={`Healthy reference (PBMC 3k) — ${data.model}`}
            xLabel="UMAP 1"
            yLabel="UMAP 2"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <FilterPanel
          modelName={modelName}
          onModelChange={setModelName}
          cellTypes={cellTypes}
          selectedCellType={selectedCellType}
          onCellTypeChange={setSelectedCellType}
          showDiseaseActivity={false}
          diseaseActivity="All"
          onDiseaseActivityChange={() => undefined}
        />
        {data !== null ? (
          <div
            className="rounded-lg border border-slate-700 p-4 text-sm text-slate-200"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <p className="mb-2 font-medium text-slate-100">Stats</p>
            <ul className="space-y-1 text-slate-300">
              <li>Total cells: {data.total_cells.toLocaleString()}</li>
              <li>Sampled: {data.sampled.toLocaleString()}</li>
              <li>Cell types: {cellTypeCount}</li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
