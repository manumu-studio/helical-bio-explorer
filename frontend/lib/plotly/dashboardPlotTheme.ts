// Explicit Plotly colors — Plotly SVG does not resolve CSS `var()` reliably; pair with `useDashboardPlotlyColors`.

/** Dark theme: plot/paper match `globals.css` `.dark` `--bg-card` (`#1a1b24`) so embeddings align with dashboard cards. */
export const PLOTLY_PALETTE_DARK = {
  paper: "#1a1b24",
  plot: "#1a1b24",
  text: "#f8fafc",
  textMuted: "#f8fafc",
  grid: "#334155",
  zeroline: "#334155",
  card: "#1a1b24",
} as const;

/** Light theme: plot/paper match `globals.css` `:root` `--bg-card` (`#f1f5f9`). */
export const PLOTLY_PALETTE_LIGHT = {
  paper: "#f1f5f9",
  plot: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#475569",
  /** Grid / zero lines — light grill on `#f1f5f9` plot. */
  grid: "#d3dae3",
  zeroline: "#d3dae3",
  card: "#f1f5f9",
} as const;

export type DashboardPlotlyPalette =
  | typeof PLOTLY_PALETTE_DARK
  | typeof PLOTLY_PALETTE_LIGHT;

/** @deprecated Prefer `useDashboardPlotlyColors()` — kept for tests or static dark reference. */
export const DASHBOARD_PLOTLY_COLORS = PLOTLY_PALETTE_DARK;

export function getPlotlyPalette(isDark: boolean): DashboardPlotlyPalette {
  return isDark ? PLOTLY_PALETTE_DARK : PLOTLY_PALETTE_LIGHT;
}
