// Reference tab: healthy PBMC UMAP colored by cell type.

import type { FetchSource } from "@/lib/fetcher";

export interface ReferenceViewProps {
  onSourceChange?: (source: FetchSource) => void;
}
