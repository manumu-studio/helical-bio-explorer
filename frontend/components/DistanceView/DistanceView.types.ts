// Distance tab: summary bar chart and per-cell model-agreement scatter.

import type { FetchSource } from "@/lib/fetcher";
import type { ScoresResponse } from "@/lib/schemas/scores";
import type { SummaryResponse } from "@/lib/schemas/summary";

export interface DistanceViewProps {
  onSourceChange?: (source: FetchSource) => void;
}

export type DistanceViewState =
  | { status: "loading" }
  | {
      status: "ready";
      summaryData: SummaryResponse;
      scoresData: ScoresResponse;
      source: FetchSource;
    }
  | { status: "not_found" }
  | { status: "error"; message: string };
