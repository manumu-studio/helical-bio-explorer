// Nivo responsive heatmap: cell type × severity, mean Geneformer distance (theme-aware).

"use client";

import { ResponsiveHeatMap } from "@nivo/heatmap";

import type { HeatmapRow } from "@/components/DistanceView/useDistanceView";
import { useDashboardPlotlyColors } from "@/lib/plotly/useDashboardPlotlyColors";

export interface DistanceHeatmapPlotProps {
  rows: HeatmapRow[];
}

export function DistanceHeatmapPlot({ rows }: DistanceHeatmapPlotProps) {
  const colors = useDashboardPlotlyColors();

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No rows for heatmap.</p>;
  }

  return (
    <div className="h-[420px] w-full">
      <ResponsiveHeatMap
        data={rows}
        margin={{ top: 60, right: 90, bottom: 80, left: 100 }}
        valueFormat=".2f"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -35,
          legend: "Cell type",
          legendOffset: 72,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Condition",
          legendOffset: -72,
          legendPosition: "middle",
        }}
        colors={{
          type: "sequential",
          scheme: "blues",
        }}
        emptyColor="var(--bg-elevated)"
        borderColor={{ from: "color", modifiers: [["darker", 0.6]] }}
        labelTextColor={{ from: "color", modifiers: [["darker", 3]] }}
        tooltip={({ cell }) => {
          const bucketCount =
            typeof cell.data === "object" && cell.data !== null && "count" in cell.data
              ? (cell.data as { count?: number }).count
              : undefined;
          return (
            <div
              className="rounded border px-2 py-1 text-xs shadow"
              style={{
                background: colors.card,
                color: colors.text,
                borderColor: colors.grid,
              }}
            >
              <div>
                <strong>{String(cell.serieId)}</strong> × {String(cell.data.x)}
              </div>
              <div>Mean distance: {cell.formattedValue ?? "—"}</div>
              <div>Cells in bucket: {bucketCount ?? "—"}</div>
            </div>
          );
        }}
        theme={{
          text: { fill: colors.text, fontSize: 11 },
          axis: { ticks: { text: { fill: colors.text } }, legend: { text: { fill: colors.text } } },
          grid: { line: { stroke: colors.grid } },
        }}
        role="img"
        ariaLabel="Mean distance to healthy heatmap"
      />
    </div>
  );
}
