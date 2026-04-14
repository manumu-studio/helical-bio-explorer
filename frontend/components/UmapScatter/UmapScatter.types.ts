// Props for the shared Plotly UMAP scatter wrapper (dark theme, responsive).

import type { Data } from "plotly.js";

export interface UmapScatterProps {
  traces: Data[];
  title: string;
  xLabel: string;
  yLabel: string;
  height?: number;
  width?: number;
}
