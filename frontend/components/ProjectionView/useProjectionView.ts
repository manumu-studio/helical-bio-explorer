// Loads healthy reference + disease projections; refetches when model or disease filters change.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ProjectionViewState } from "@/components/ProjectionView/ProjectionView.types";
import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, type FetchSource } from "@/lib/fetcher";
import { fetchJsonOrNotFound } from "@/lib/fetchJson";
import { EmbeddingResponseSchema } from "@/lib/schemas/embeddings";
import { ProjectionResponseSchema } from "@/lib/schemas/projections";

export function useProjectionView(
  onSourceChange: ((source: FetchSource) => void) | undefined,
  modelName: string,
  onModelNameChange: (name: string) => void,
) {
  const [selectedCellType, setSelectedCellType] = useState("All");
  const [diseaseActivity, setDiseaseActivity] = useState("All");
  const [viewState, setViewState] = useState<ProjectionViewState>({ status: "loading" });

  const onSourceChangeRef = useRef(onSourceChange);
  onSourceChangeRef.current = onSourceChange;

  const reportSource = useCallback((next: FetchSource) => {
    onSourceChangeRef.current?.(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setViewState({ status: "loading" });
      try {
        const base = getClientBackendBaseUrl();
        const healthyUrl = `${base}/api/v1/embeddings/pbmc3k/${modelName}?sample_size=5000`;
        const params = new URLSearchParams();
        params.set("sample_size", "5000");
        if (selectedCellType !== "All") {
          params.set("cell_type", selectedCellType);
        }
        if (diseaseActivity !== "All") {
          params.set("disease_activity", diseaseActivity);
        }
        const diseaseUrl = `${base}/api/v1/projections/covid_wilk/${modelName}?${params.toString()}`;
        const [healthyResult, diseaseResult] = await Promise.all([
          fetchJsonOrNotFound(healthyUrl, EmbeddingResponseSchema),
          fetchJsonOrNotFound(diseaseUrl, ProjectionResponseSchema),
        ]);
        if (cancelled) {
          return;
        }
        if (healthyResult.status === "not_found" || diseaseResult.status === "not_found") {
          setViewState({ status: "not_found" });
          reportSource("unknown");
          return;
        }
        setViewState({
          status: "ready",
          healthyData: healthyResult.data,
          diseaseData: diseaseResult.data,
          source: diseaseResult.source,
        });
        reportSource(diseaseResult.source);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof FetchError ? e.message : "Failed to load projections";
        setViewState({ status: "error", message });
        reportSource("unknown");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [diseaseActivity, modelName, reportSource, selectedCellType]);

  const healthyData = viewState.status === "ready" ? viewState.healthyData : null;
  const diseaseData = viewState.status === "ready" ? viewState.diseaseData : null;

  const cellTypes = useMemo(() => {
    const unique = new Set<string>();
    healthyData?.cells.forEach((c) => {
      unique.add(c.cell_type);
    });
    diseaseData?.cells.forEach((c) => {
      unique.add(c.cell_type);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [diseaseData, healthyData]);

  return {
    modelName,
    setModelName: onModelNameChange,
    selectedCellType,
    setSelectedCellType,
    diseaseActivity,
    setDiseaseActivity,
    viewState,
    healthyData,
    diseaseData,
    cellTypes,
  };
}
