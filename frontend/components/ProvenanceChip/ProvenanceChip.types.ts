// Props for the API provenance pill (S3 vs local artifact source).

import type { FetchSource } from "@/lib/fetcher";

export interface ProvenanceChipProps {
  source: FetchSource;
}
