// View 2: disease projection on healthy UMAP — per–cell-type traces, sick-cell fade-in, three-column shell.

"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Data } from "plotly.js";

import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { MobileFilterToolbar } from "@/components/dashboard/MobileFilterToolbar";
import { SelectedCellsPanel } from "@/components/dashboard/SelectedCellsPanel";
import type { SelectedCellsPanelRow } from "@/components/dashboard/SelectedCellsPanel/SelectedCellsPanel.types";
import { ChartSkeleton } from "@/components/ChartSkeleton";
import { DashboardEmptyState } from "@/components/DashboardEmptyState";
import type { ProjectionViewProps } from "@/components/ProjectionView/ProjectionView.types";
import { useProjectionView } from "@/components/ProjectionView/useProjectionView";
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

export function ProjectionView({ onSourceChange, modelName, onModelNameChange }: ProjectionViewProps) {
  const {
    setModelName,
    viewState,
    healthyData,
    diseaseData,
    filteredDiseaseCells,
    cellTypes,
    divergenceBounds,
  } = useProjectionView(onSourceChange, modelName, onModelNameChange);

  const selectedCellIds = useSelectionStore((s) => s.selectedCellIds);
  const setSelectedCellIds = useSelectionStore((s) => s.setSelectedCellIds);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const hoveredCellId = useSelectionStore((s) => s.hoveredCellId);

  const reduceMotion = useReducedMotion();
  const [covidOpacity, setCovidOpacity] = useState(0);

  useEffect(() => {
    if (diseaseData === null || filteredDiseaseCells.length === 0) {
      setCovidOpacity(0);
      return;
    }
    if (reduceMotion) {
      setCovidOpacity(0.8);
      return;
    }
    setCovidOpacity(0);
    let raf = 0;
    const t = window.setTimeout(() => {
      let start = 0;
      const duration = 800;
      const tick = (now: number) => {
        if (start === 0) {
          start = now;
        }
        const p = Math.min(1, (now - start) / duration);
        setCovidOpacity(0.8 * p);
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        }
      };
      raf = requestAnimationFrame(tick);
    }, 300);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [diseaseData, filteredDiseaseCells.length, reduceMotion]);

  const cellTypeCounts = useMemo(
    () => countCellsByCanonical([...(healthyData?.cells ?? []), ...(diseaseData?.cells ?? [])]),
    [diseaseData?.cells, healthyData?.cells],
  );

  const detailRows: SelectedCellsPanelRow[] = useMemo(() => {
    if (filteredDiseaseCells.length === 0 || selectedCellIds.length === 0) {
      return [];
    }
    const idSet = new Set(selectedCellIds);
    return filteredDiseaseCells
      .filter((c) => idSet.has(c.cell_id))
      .map((c) => ({
        cell_id: c.cell_id,
        cell_type: c.cell_type,
        condition: c.disease_activity,
        divergence: c.distance_to_healthy,
      }));
  }, [filteredDiseaseCells, selectedCellIds]);

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
    if (filteredDiseaseCells.length === 0) {
      return out;
    }
    const byCanon = new Map<KnownCellType, typeof filteredDiseaseCells>();
    const unknown: typeof filteredDiseaseCells = [];
    for (const c of filteredDiseaseCells) {
      const canon = resolveCanonicalCellType(c.cell_type);
      if (canon === null) {
        unknown.push(c);
        continue;
      }
      const list = byCanon.get(canon) ?? [];
      list.push(c);
      byCanon.set(canon, list);
    }
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
        customdata: cells.map((c) => [c.disease_activity, c.distance_to_healthy] as [string, number]),
        marker: {
          size: cells.map((c) => (hoveredCellId === c.cell_id ? 12 : 7)),
          color,
          opacity: covidOpacity,
        },
        hovertemplate:
          `<b>%{text}</b><br>Type: ${canon}<br>Condition: %{customdata[0]}<br>Divergence: %{customdata[1]:.4f}<extra></extra>`,
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
        customdata: unknown.map((c) => [c.disease_activity, c.distance_to_healthy] as [string, number]),
        marker: {
          size: unknown.map((c) => (hoveredCellId === c.cell_id ? 12 : 7)),
          color: HEALTHY_GREY,
          opacity: covidOpacity,
        },
        hovertemplate:
          "<b>%{text}</b><br>Condition: %{customdata[0]}<br>Divergence: %{customdata[1]:.4f}<extra></extra>",
      });
    }
    return out;
  }, [covidOpacity, filteredDiseaseCells, healthyData, hoveredCellId]);

  const hasSelection = selectedCellIds.length > 0;

  return (
    <div
      className={`flex h-full min-h-0 w-full flex-1 flex-col xl:grid xl:grid-rows-[minmax(0,1fr)] xl:gap-0 ${hasSelection ? "xl:grid-cols-[240px_1fr_minmax(0,320px)]" : "xl:grid-cols-[240px_1fr]"}`}
    >
      <FilterSidebar
        activeTab="projection"
        datasetLabel="COVID-19 (Wilk) vs PBMC reference"
        modelLabel={modelName}
        showModelToggle
        modelName={modelName}
        onModelChange={setModelName}
        cellTypeCounts={cellTypeCounts}
        showConditionFilter
        showDivergenceSlider
        divergenceSliderMin={divergenceBounds.min}
        divergenceSliderMax={divergenceBounds.max}
      />

      <MobileFilterToolbar
        activeTab="projection"
        showModelToggle
        modelName={modelName}
        onModelChange={setModelName}
        cellTypeCounts={cellTypeCounts}
        showConditionFilter
        showDivergenceSlider
        divergenceSliderMin={divergenceBounds.min}
        divergenceSliderMax={divergenceBounds.max}
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
          <DashboardEmptyState viewName="Projection" dataset="covid_wilk" model={modelName} />
        ) : null}
        {viewState.status === "ready" && healthyData !== null && diseaseData !== null && traces.length > 0 ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              <UmapScatter
                traces={traces}
                title={`COVID projection — ${diseaseData.model}`}
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
                  <li>Total cells: {diseaseData.total_cells.toLocaleString()}</li>
                  <li>Sampled: {diseaseData.sampled.toLocaleString()}</li>
                  <li>Types in view: {cellTypes.length}</li>
                </ul>
              </div>
              <div
                className="flex-1 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <p className="mb-1 font-medium text-[var(--text-primary)]">What you&apos;re seeing</p>
                <p>
                  COVID-19 disease cells (Wilk et al.) projected onto the healthy PBMC reference manifold
                  using <strong className="text-[var(--text-primary)]">{diseaseData.model}</strong>.
                  Grey dots are healthy reference cells; colored dots are disease cells.
                  Cells far from healthy clusters indicate disease-driven transcriptomic shifts.
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
