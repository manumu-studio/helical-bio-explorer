// Resolves dashboard Plotly hex palette from next-themes (Plotly cannot use CSS variables in SVG).

"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";

import { getPlotlyPalette, type DashboardPlotlyPalette } from "@/lib/plotly/dashboardPlotTheme";

export function useDashboardPlotlyColors(): DashboardPlotlyPalette {
  const { resolvedTheme } = useTheme();
  return useMemo(() => getPlotlyPalette(resolvedTheme !== "light"), [resolvedTheme]);
}
