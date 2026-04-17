// Client fetch for GET /api/v1/provenance/{datasetSlug}/{modelName}.

import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { fetchJsonOrNotFound } from "@/lib/fetchJson";
import { ProvenanceResponseSchema, type ProvenanceResponse } from "@/lib/schemas/provenance";

export async function fetchProvenance(
  datasetSlug: string,
  modelName: string,
): Promise<ProvenanceResponse | null> {
  const base = getClientBackendBaseUrl();
  const url = `${base}/api/v1/provenance/${datasetSlug}/${modelName}`;
  const result = await fetchJsonOrNotFound(url, ProvenanceResponseSchema);
  if (result.status === "not_found") {
    return null;
  }
  return result.data;
}
