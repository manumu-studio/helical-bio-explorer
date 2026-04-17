// Props for the API provenance pill (S3 vs local artifact source + optional run metadata).

import type { FetchSource } from "@/lib/fetcher";
import type { ProvenanceResponse } from "@/lib/schemas/provenance";

export interface ProvenanceChipProps {
  source: FetchSource;
  provenance: ProvenanceResponse | null;
}
