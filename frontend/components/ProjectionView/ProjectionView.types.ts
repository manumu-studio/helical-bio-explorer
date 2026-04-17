// Projection tab: disease cells overlaid on the healthy reference UMAP.

import type { FetchSource } from "@/lib/fetcher";
import type { EmbeddingResponse } from "@/lib/schemas/embeddings";
import type { ProjectionResponse } from "@/lib/schemas/projections";

export interface ProjectionViewProps {
  onSourceChange?: (source: FetchSource) => void;
  modelName: string;
  onModelNameChange: (name: string) => void;
}

export type ProjectionViewState =
  | { status: "loading" }
  | {
      status: "ready";
      healthyData: EmbeddingResponse;
      diseaseData: ProjectionResponse;
      source: FetchSource;
    }
  | { status: "not_found" }
  | { status: "error"; message: string };
