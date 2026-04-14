// Disagreement tab: average distance vs cross-model disagreement, with filters.

import type { FetchSource } from "@/lib/fetcher";

export interface DisagreementViewProps {
  onSourceChange?: (source: FetchSource) => void;
}
