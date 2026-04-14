// Distance tab: summary bar chart and per-cell model-agreement scatter.

import type { FetchSource } from "@/lib/fetcher";

export interface DistanceViewProps {
  onSourceChange?: (source: FetchSource) => void;
}
