// Projection tab: disease cells overlaid on the healthy reference UMAP.

import type { FetchSource } from "@/lib/fetcher";

export interface ProjectionViewProps {
  onSourceChange?: (source: FetchSource) => void;
}
