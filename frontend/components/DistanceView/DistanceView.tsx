// View 3: Nivo heatmap (mean distance) + GF vs GenePT scatter; three-column shell (no UMAP lasso).

"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ComponentProps } from "react";
import type { Data, Layout } from "plotly.js";

import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { MobileFilterToolbar } from "@/components/dashboard/MobileFilterToolbar";
import { ChartSkeleton } from "@/components/ChartSkeleton";
import { DashboardEmptyState } from "@/components/DashboardEmptyState";
import { DistanceHeatmapPlot } from "@/components/DistanceView/DistanceHeatmapPlot";
import type { DistanceViewProps } from "@/components/DistanceView/DistanceView.types";
import { useDistanceView } from "@/components/DistanceView/useDistanceView";
import { getCellColor } from "@/lib/constants/cell-colors";
import { countCellsByCanonical } from "@/lib/dashboard/cellCounts";
import { useIsCompactChartLayout } from "@/lib/hooks/useMediaQuery";
import { useDashboardPlotlyColors } from "@/lib/plotly/useDashboardPlotlyColors";

const Plot = dynamic(async () => import("react-plotly.js"), { ssr: false });

type PlotProps = ComponentProps<typeof Plot>;

export function DistanceView({ onSourceChange }: DistanceViewProps) {
  const { viewState, scoresData, filteredScoreCells, heatmapRows } = useDistanceView(onSourceChange);
  const plotColors = useDashboardPlotlyColors();
  const compact = useIsCompactChartLayout();

  const cellTypeCounts = useMemo(
    () => countCellsByCanonical(scoresData?.cells ?? []),
    [scoresData?.cells],
  );

  const scatterPack = useMemo(() => {
    if (filteredScoreCells.length === 0) {
      const emptyCells: Data = {
        type: "scattergl",
        mode: "markers",
        x: [],
        y: [],
      };
      const emptyDiagonal: Data = {
        type: "scatter",
        mode: "lines",
        x: [0, 1],
        y: [0, 1],
        line: { color: "#64748b", width: 1, dash: "dash" },
        showlegend: false,
        hoverinfo: "skip",
      };
      const traces: Data[] = [emptyCells, emptyDiagonal];
      return { traces, minVal: 0, maxVal: 1 };
    }
    const xs = filteredScoreCells.map((c) => c.distance_geneformer);
    const ys = filteredScoreCells.map((c) => c.distance_genept);
    const minVal = Math.min(0, ...xs, ...ys);
    const maxVal = Math.max(0.0001, ...xs, ...ys);
    const cellsTrace: Data = {
      type: "scattergl",
      mode: "markers",
      name: "Cells",
      x: xs,
      y: ys,
      marker: {
        size: 6,
        color: filteredScoreCells.map((c) => getCellColor(c.cell_type)),
      },
      text: filteredScoreCells.map((c) => `${c.cell_id} (${c.cell_type})`),
      hoverinfo: "x+y+text",
    };
    const diagonalTrace: Data = {
      type: "scatter",
      mode: "lines",
      x: [minVal, maxVal],
      y: [minVal, maxVal],
      line: { color: "#64748b", width: 1, dash: "dash" },
      showlegend: false,
      hoverinfo: "skip",
    };
    return { traces: [cellsTrace, diagonalTrace], minVal, maxVal };
  }, [filteredScoreCells]);

  const scatterLayout: Partial<Layout> = useMemo(
    () => ({
      title: compact
        ? {
            text: "Model agreement (per cell)",
            font: { color: plotColors.text, size: 12 },
            x: 0.02,
            xanchor: "left",
            pad: { t: 4, b: 8 },
          }
        : {
            text: "Model agreement (per cell)",
            font: { color: plotColors.text, size: 14 },
          },
      paper_bgcolor: plotColors.paper,
      plot_bgcolor: plotColors.plot,
      font: { color: plotColors.text },
      xaxis: {
        title: {
          text: "Distance (Geneformer)",
          font: { color: plotColors.textMuted, size: compact ? 11 : 14 },
        },
        tickfont: { size: compact ? 10 : 12 },
        color: plotColors.text,
        gridcolor: plotColors.grid,
        zerolinecolor: plotColors.zeroline,
        range: [scatterPack.minVal, scatterPack.maxVal],
      },
      yaxis: {
        title: {
          text: "Distance (GenePT)",
          font: { color: plotColors.textMuted, size: compact ? 11 : 14 },
        },
        tickfont: { size: compact ? 10 : 12 },
        color: plotColors.text,
        gridcolor: plotColors.grid,
        zerolinecolor: plotColors.zeroline,
        range: [scatterPack.minVal, scatterPack.maxVal],
      },
      showlegend: false,
      margin: compact
        ? { l: 42, r: 8, t: 52, b: 40 }
        : { l: 56, r: 16, t: 48, b: 56 },
      autosize: true,
      hovermode: "closest",
    }),
    [compact, plotColors, scatterPack.minVal, scatterPack.maxVal],
  );

  const config: PlotProps["config"] = useMemo(
    () => ({
      responsive: true,
      displayModeBar: compact ? "hover" : true,
      displaylogo: false,
    }),
    [compact],
  );

  const ready = viewState.status === "ready" && scoresData !== null;
  const showHeatmap = ready && heatmapRows.length > 0;
  const showScatter = ready && filteredScoreCells.length > 0;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col xl:grid xl:gap-0 xl:grid-cols-[240px_1fr]">
      <FilterSidebar
        activeTab="distance"
        datasetLabel="COVID-19 (Wilk) distance scores"
        modelLabel="Geneformer × GenePT"
        showModelToggle={false}
        cellTypeCounts={cellTypeCounts}
        showConditionFilter={false}
        showDivergenceSlider={false}
        divergenceSliderMin={0}
        divergenceSliderMax={1}
      />

      <MobileFilterToolbar
        activeTab="distance"
        showModelToggle={false}
        cellTypeCounts={cellTypeCounts}
        showConditionFilter={false}
        showDivergenceSlider={false}
        divergenceSliderMin={0}
        divergenceSliderMax={1}
      />

      <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto border-x border-[var(--border)] bg-[var(--bg-base)] px-2 pb-2 pt-0 xl:border-x">
        {viewState.status === "loading" ? (
          <>
            <ChartSkeleton variant="heatmap" />
            <ChartSkeleton variant="scatter" />
          </>
        ) : null}
        {viewState.status === "error" ? (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
            {viewState.message}
          </div>
        ) : null}
        {viewState.status === "not_found" ? (
          <DashboardEmptyState viewName="Distance" dataset="covid_wilk" model="Geneformer × GenePT" />
        ) : null}

        {showHeatmap ? (
          <div className="min-h-[300px] w-full flex-1">
            <DistanceHeatmapPlot rows={heatmapRows} />
          </div>
        ) : null}

        {ready && !showHeatmap ? (
          <p className="text-sm text-[var(--text-secondary)]">No heatmap buckets for current filters.</p>
        ) : null}

        {showScatter ? (
          <div className="min-h-[300px] w-full flex-1">
            <Plot
              key={plotColors.paper}
              data={scatterPack.traces}
              layout={scatterLayout}
              config={config}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
