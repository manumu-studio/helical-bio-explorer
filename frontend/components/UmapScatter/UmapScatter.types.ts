// Props for Plotly UMAP scatter: themed layout (grid + ticks), lasso selection, optional layout overrides.

import type { Data, Layout } from "plotly.js";

export interface UmapScatterProps {
  traces: Data[];
  title: string;
  xLabel: string;
  yLabel: string;
  height?: number | string;
  width?: number;
  layoutOverrides?: Partial<Layout>;
  onSelectedCellIds?: (cellIds: string[]) => void;
  onClearSelection?: () => void;
}
