// Disagreement tab: average distance vs cross-model disagreement, with filters.

import type { FetchSource } from "@/lib/fetcher";
import type { DisagreementResponse } from "@/lib/schemas/disagreement";

export interface DisagreementViewProps {
  onSourceChange?: (source: FetchSource) => void;
}

export type DisagreementViewState =
  | { status: "loading" }
  | { status: "ready"; data: DisagreementResponse; source: FetchSource }
  | { status: "not_found" }
  | { status: "error"; message: string };
