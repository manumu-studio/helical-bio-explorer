// View 2: disease projection trace over a grey healthy reference cloud.

"use client";

import { useMemo } from "react";
import type { Data } from "plotly.js";

import { FilterPanel } from "@/components/FilterPanel";
import type { ProjectionViewProps } from "@/components/ProjectionView/ProjectionView.types";
import { useProjectionView } from "@/components/ProjectionView/useProjectionView";
import { UmapScatter } from "@/components/UmapScatter";

const HEALTHY_GREY = "#94a3b8";
const HIGH_COLOR = "#f87171";
const LOW_COLOR = "#60a5fa";

export function ProjectionView({ onSourceChange }: ProjectionViewProps) {
  const {
    modelName,
    setModelName,
    selectedCellType,
    setSelectedCellType,
    diseaseActivity,
    setDiseaseActivity,
    loading,
    error,
    healthyData,
    diseaseData,
    cellTypes,
  } = useProjectionView(onSourceChange);

  const traces: Data[] = useMemo(() => {
    const out: Data[] = [];
    if (healthyData !== null && healthyData.cells.length > 0) {
      out.push({
        type: "scattergl",
        mode: "markers",
        name: "Healthy reference",
        x: healthyData.cells.map((c) => c.umap_1),
        y: healthyData.cells.map((c) => c.umap_2),
        marker: { size: 3, color: HEALTHY_GREY, opacity: 0.3 },
        hoverinfo: "skip",
      });
    }
    if (diseaseData !== null && diseaseData.cells.length > 0) {
      const cells = diseaseData.cells;
      out.push({
        type: "scattergl",
        mode: "markers",
        name: "Disease (cSLE)",
        x: cells.map((c) => c.umap_1),
        y: cells.map((c) => c.umap_2),
        marker: {
          size: 7,
          color: cells.map((c) => (c.disease_activity === "high" ? HIGH_COLOR : LOW_COLOR)),
        },
        customdata: cells.map(
          (c) =>
            `cell_id: ${c.cell_id}<br>cell_type: ${c.cell_type}<br>disease_activity: ${c.disease_activity}<br>distance_to_healthy: ${String(c.distance_to_healthy)}`,
        ),
        hovertemplate: "%{customdata}<extra></extra>",
      });
    }
    return out;
  }, [diseaseData, healthyData]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        {loading ? (
          <div className="flex h-[520px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900/40 text-slate-400">
            Loading…
          </div>
        ) : null}
        {error !== null && !loading ? (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {!loading && error === null && healthyData !== null && diseaseData !== null ? (
          <UmapScatter
            traces={traces}
            title={`Disease projection — ${diseaseData.model}`}
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
          showDiseaseActivity
          diseaseActivity={diseaseActivity}
          onDiseaseActivityChange={setDiseaseActivity}
        />
        {diseaseData !== null ? (
          <div
            className="rounded-lg border border-slate-700 p-4 text-sm text-slate-200"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <p className="mb-2 font-medium text-slate-100">Stats</p>
            <ul className="space-y-1 text-slate-300">
              <li>Total disease cells: {diseaseData.total_cells.toLocaleString()}</li>
              <li>Sampled: {diseaseData.sampled.toLocaleString()}</li>
              <li>
                Filters: model {diseaseData.model}, cell type {selectedCellType}, activity{" "}
                {diseaseActivity}
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
