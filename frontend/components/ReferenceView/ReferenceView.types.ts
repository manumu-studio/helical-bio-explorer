// Reference tab: healthy PBMC UMAP colored by cell type.

import type { FetchSource } from "@/lib/fetcher";
import type { EmbeddingResponse } from "@/lib/schemas/embeddings";

export interface ReferenceViewProps {
  onSourceChange?: (source: FetchSource) => void;
  modelName: string;
  onModelNameChange: (name: string) => void;
}

export type ReferenceViewState =
  | { status: "loading" }
  | { status: "ready"; data: EmbeddingResponse; source: FetchSource }
  | { status: "not_found" }
  | { status: "error"; message: string };
