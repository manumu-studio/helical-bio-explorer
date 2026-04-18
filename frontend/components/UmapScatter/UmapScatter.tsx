// Client-only Plotly scatter: slate-800 canvas, grid + axis ticks, fills parent height when `height` omitted, lasso selection, no legend.

"use client";

import dynamic from "next/dynamic";
import type { Layout } from "plotly.js";
import { useMemo } from "react";
import type { ComponentProps, CSSProperties } from "react";

import type { UmapScatterProps } from "@/components/UmapScatter/UmapScatter.types";
import { useIsCompactChartLayout } from "@/lib/hooks/useMediaQuery";
import { useDashboardPlotlyColors } from "@/lib/plotly/useDashboardPlotlyColors";

const Plot = dynamic(async () => import("react-plotly.js"), { ssr: false });

type PlotProps = ComponentProps<typeof Plot>;

export function UmapScatter({
  traces,
  title,
  xLabel,
  yLabel,
  height,
  width,
  layoutOverrides,
  onSelectedCellIds,
  onClearSelection,
}: UmapScatterProps) {
  const plotColors = useDashboardPlotlyColors();
  const compact = useIsCompactChartLayout();

  const layout: Partial<Layout> = useMemo(
    () => ({
      ...(layoutOverrides ?? {}),
      title: compact
        ? {
            text: title,
            font: { color: plotColors.text, size: 12 },
            x: 0.02,
            xanchor: "left",
            pad: { t: 4, b: 8 },
          }
        : { text: title, font: { color: plotColors.text, size: 16 } },
      paper_bgcolor: plotColors.paper,
      plot_bgcolor: plotColors.plot,
      font: { color: plotColors.text },
      dragmode: "lasso",
      xaxis: {
        title: { text: xLabel, font: { color: plotColors.textMuted, size: compact ? 11 : 14 } },
        tickfont: { size: compact ? 10 : 12 },
        color: plotColors.text,
        gridcolor: plotColors.grid,
        zerolinecolor: plotColors.zeroline,
      },
      yaxis: {
        title: { text: yLabel, font: { color: plotColors.textMuted, size: compact ? 11 : 14 } },
        tickfont: { size: compact ? 10 : 12 },
        color: plotColors.text,
        gridcolor: plotColors.grid,
        zerolinecolor: plotColors.zeroline,
      },
      showlegend: false,
      margin: compact
        ? { l: 42, r: 8, t: 52, b: 40 }
        : { l: 56, r: 24, t: 48, b: 48 },
      hovermode: "closest",
      autosize: true,
    }),
    [compact, layoutOverrides, plotColors, title, xLabel, yLabel],
  );

  const config: PlotProps["config"] = {
    responsive: true,
    displayModeBar: compact ? "hover" : true,
    displaylogo: false,
  };

  const plotStyle: CSSProperties = {
    width: width ?? "100%",
    height: height ?? "100%",
  };

  return (
    <div className="h-full min-h-0 w-full min-w-0">
      <Plot
      key={plotColors.paper}
      data={traces}
      layout={layout}
      config={config}
      style={plotStyle}
      useResizeHandler
      onSelected={(ev) => {
        const pts = ev?.points;
        if (pts === undefined || pts.length === 0) {
          return;
        }
        const ids = pts
          .map((p) => {
            const t = p.text;
            return typeof t === "string" ? t : Array.isArray(t) ? t[0] : undefined;
          })
          .filter((x): x is string => typeof x === "string");
        onSelectedCellIds?.(ids);
      }}
      onDeselect={() => {
        onClearSelection?.();
      }}
      />
    </div>
  );
}
