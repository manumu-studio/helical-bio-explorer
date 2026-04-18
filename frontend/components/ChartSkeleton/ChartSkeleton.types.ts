// Loading placeholders matching chart footprint to avoid layout shift.

export interface ChartSkeletonProps {
  /** `heatmap` / `scatter` — Distance tab; `umap` — embedding views; `bar` — generic block. */
  variant: "umap" | "bar" | "heatmap" | "scatter";
}
