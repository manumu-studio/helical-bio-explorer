// Client-only Plotly scatter wrapper with a consistent dark theme for UMAP-style charts.

"use client";

import dynamic from "next/dynamic";
import type { Layout } from "plotly.js";
import type { ComponentProps } from "react";

import type { UmapScatterProps } from "@/components/UmapScatter/UmapScatter.types";

const Plot = dynamic(async () => import("react-plotly.js"), { ssr: false });

type PlotProps = ComponentProps<typeof Plot>;

const SURFACE = "#1e293b";
const TEXT = "#f8fafc";
const GRID = "#334155";

export function UmapScatter({
  traces,
  title,
  xLabel,
  yLabel,
  height = 520,
  width,
}: UmapScatterProps) {
  const layout: Partial<Layout> = {
    title: { text: title, font: { color: TEXT, size: 16 } },
    paper_bgcolor: SURFACE,
    plot_bgcolor: SURFACE,
    font: { color: TEXT },
    xaxis: {
      title: { text: xLabel },
      color: TEXT,
      gridcolor: GRID,
      zerolinecolor: GRID,
    },
    yaxis: {
      title: { text: yLabel },
      color: TEXT,
      gridcolor: GRID,
      zerolinecolor: GRID,
    },
    legend: {
      x: 1,
      y: 1,
      xanchor: "right",
      yanchor: "top",
      bgcolor: "rgba(15,23,42,0.4)",
      borderwidth: 0,
      font: { color: TEXT, size: 11 },
    },
    hovermode: "closest",
    margin: { l: 56, r: 24, t: 48, b: 48 },
    autosize: true,
  };

  const config: PlotProps["config"] = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={config}
      style={{ width: width ?? "100%", height }}
      useResizeHandler
    />
  );
}
