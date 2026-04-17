// View 3: grouped mean-distance bars (summary) and GF vs GenePT agreement scatter (sampled scores).

"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ComponentProps } from "react";
import type { Data, Layout } from "plotly.js";

import { ChartSkeleton } from "@/components/ChartSkeleton";
import { DashboardEmptyState } from "@/components/DashboardEmptyState";
import { FilterPanel } from "@/components/FilterPanel";
import type { DistanceViewProps } from "@/components/DistanceView/DistanceView.types";
import { useDistanceView } from "@/components/DistanceView/useDistanceView";
import { getCellColor } from "@/lib/constants/cell-colors";
import type { CellTypeSummary } from "@/lib/schemas/summary";

const Plot = dynamic(async () => import("react-plotly.js"), { ssr: false });

type PlotProps = ComponentProps<typeof Plot>;

const SURFACE = "#1e293b";
const TEXT = "#f8fafc";
const GRID = "#334155";

function categoriesFromGroups(groups: CellTypeSummary[]): string[] {
  return Array.from(new Set(groups.map((g) => g.cell_type))).sort((a, b) => a.localeCompare(b));
}

function seriesFor(
  groups: CellTypeSummary[],
  categories: string[],
  activity: "low" | "high",
  field: "geneformer" | "genept",
): { y: (number | null)[]; error: (number | null)[] } {
  const y: (number | null)[] = [];
  const error: (number | null)[] = [];
  for (const ct of categories) {
    const row = groups.find((g) => g.cell_type === ct && g.disease_activity === activity);
    if (row === undefined) {
      y.push(null);
      error.push(null);
    } else if (field === "geneformer") {
      y.push(row.mean_distance_geneformer);
      error.push(row.std_distance_geneformer);
    } else {
      y.push(row.mean_distance_genept);
      error.push(row.std_distance_genept);
    }
  }
  return { y, error };
}

export function DistanceView({ onSourceChange }: DistanceViewProps) {
  const {
    selectedCellType,
    setSelectedCellType,
    viewState,
    scoresData,
    cellTypes,
    filteredGroups,
    filteredScoreCells,
  } = useDistanceView(onSourceChange);

  const barData = useMemo(() => {
    const categories = categoriesFromGroups(filteredGroups);
    const gfLow = seriesFor(filteredGroups, categories, "low", "geneformer");
    const gfHigh = seriesFor(filteredGroups, categories, "high", "geneformer");
    const gtLow = seriesFor(filteredGroups, categories, "low", "genept");
    const gtHigh = seriesFor(filteredGroups, categories, "high", "genept");

    const traces: Data[] = [
      {
        type: "bar",
        name: "Geneformer · low",
        x: categories,
        y: gfLow.y,
        error_y: { type: "data", array: gfLow.error, visible: true, color: "#94a3b8" },
        marker: { color: "#38bdf8" },
      },
      {
        type: "bar",
        name: "Geneformer · high",
        x: categories,
        y: gfHigh.y,
        error_y: { type: "data", array: gfHigh.error, visible: true, color: "#94a3b8" },
        marker: { color: "#0ea5e9" },
      },
      {
        type: "bar",
        name: "GenePT · low",
        x: categories,
        y: gtLow.y,
        error_y: { type: "data", array: gtLow.error, visible: true, color: "#94a3b8" },
        marker: { color: "#4ade80" },
      },
      {
        type: "bar",
        name: "GenePT · high",
        x: categories,
        y: gtHigh.y,
        error_y: { type: "data", array: gtHigh.error, visible: true, color: "#94a3b8" },
        marker: { color: "#22c55e" },
      },
    ];
    return { traces, categories };
  }, [filteredGroups]);

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

  const barLayout: Partial<Layout> = {
    title: { text: "Mean distance to healthy (by cell type)", font: { color: TEXT, size: 14 } },
    paper_bgcolor: SURFACE,
    plot_bgcolor: SURFACE,
    font: { color: TEXT },
    barmode: "group",
    xaxis: { title: { text: "Cell type" }, color: TEXT, gridcolor: GRID },
    yaxis: { title: { text: "Mean distance" }, color: TEXT, gridcolor: GRID },
    legend: {
      orientation: "h",
      y: -0.2,
      font: { color: TEXT, size: 10 },
      bgcolor: "transparent",
    },
    margin: { l: 56, r: 16, t: 48, b: 120 },
    autosize: true,
  };

  const scatterLayout: Partial<Layout> = {
    title: { text: "Model agreement (per cell)", font: { color: TEXT, size: 14 } },
    paper_bgcolor: SURFACE,
    plot_bgcolor: SURFACE,
    font: { color: TEXT },
    xaxis: {
      title: { text: "Distance (Geneformer)" },
      color: TEXT,
      gridcolor: GRID,
      range: [scatterPack.minVal, scatterPack.maxVal],
    },
    yaxis: {
      title: { text: "Distance (GenePT)" },
      color: TEXT,
      gridcolor: GRID,
      range: [scatterPack.minVal, scatterPack.maxVal],
    },
    showlegend: false,
    margin: { l: 56, r: 16, t: 48, b: 56 },
    autosize: true,
    hovermode: "closest",
  };

  const config: PlotProps["config"] = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
  };

  const ready = viewState.status === "ready" && scoresData !== null;
  const showBar = ready && barData.categories.length > 0;
  const showScatter = ready && filteredScoreCells.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="flex min-w-0 flex-col gap-8">
        {viewState.status === "loading" ? (
          <>
            <ChartSkeleton variant="bar" />
            <ChartSkeleton variant="bar" />
          </>
        ) : null}
        {viewState.status === "error" ? (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
            {viewState.message}
          </div>
        ) : null}
        {viewState.status === "not_found" ? (
          <DashboardEmptyState viewName="Distance" dataset="covid_wilk" model="geneformer × genept" />
        ) : null}

        {showBar ? (
          <div className="min-h-[420px] w-full">
            <Plot
              data={barData.traces}
              layout={barLayout}
              config={config}
              style={{ width: "100%", height: 420 }}
              useResizeHandler
            />
          </div>
        ) : null}

        {ready && !showBar ? (
          <p className="text-sm text-slate-400">No aggregated bars for this cell-type filter.</p>
        ) : null}

        {showScatter ? (
          <div className="min-h-[420px] w-full">
            <Plot
              data={scatterPack.traces}
              layout={scatterLayout}
              config={config}
              style={{ width: "100%", height: 420 }}
              useResizeHandler
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <FilterPanel
          modelName="geneformer"
          onModelChange={() => undefined}
          showModel={false}
          cellTypes={cellTypes}
          selectedCellType={selectedCellType}
          onCellTypeChange={setSelectedCellType}
          showDiseaseActivity={false}
          diseaseActivity="All"
          onDiseaseActivityChange={() => undefined}
        />
      </div>
    </div>
  );
}
