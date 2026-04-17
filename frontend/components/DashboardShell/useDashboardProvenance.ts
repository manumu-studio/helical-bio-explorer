// Loads latest precompute provenance for the active tab’s dataset × model pair.

import { useEffect, useState } from "react";

import type { DashboardTabId } from "@/components/DashboardShell/DashboardShell.types";
import { fetchProvenance } from "@/lib/fetchers/provenance";
import type { ProvenanceResponse } from "@/lib/schemas/provenance";

function provenanceKey(
  tab: DashboardTabId,
  referenceModel: string,
  projectionModel: string,
): { datasetSlug: string; modelName: string } {
  switch (tab) {
    case "reference":
      return { datasetSlug: "pbmc3k", modelName: referenceModel };
    case "projection":
      return { datasetSlug: "covid_wilk", modelName: projectionModel };
    case "distance":
      return { datasetSlug: "covid_wilk", modelName: projectionModel };
    case "disagreement":
      return { datasetSlug: "covid_wilk", modelName: projectionModel };
  }
}

export function useDashboardProvenance(
  activeTab: DashboardTabId,
  referenceModel: string,
  projectionModel: string,
) {
  const [provenance, setProvenance] = useState<ProvenanceResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { datasetSlug, modelName } = provenanceKey(activeTab, referenceModel, projectionModel);

    async function load() {
      try {
        const result = await fetchProvenance(datasetSlug, modelName);
        if (!cancelled) {
          setProvenance(result);
        }
      } catch {
        if (!cancelled) {
          setProvenance(null);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, referenceModel, projectionModel]);

  return { provenance };
}
