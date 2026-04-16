// Loads healthy reference + disease projections; refetches when model or disease filters change.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, fetcher, type FetchSource } from "@/lib/fetcher";
import {
  EmbeddingResponseSchema,
  type EmbeddingResponse,
} from "@/lib/schemas/embeddings";
import {
  ProjectionResponseSchema,
  type ProjectionResponse,
} from "@/lib/schemas/projections";

export function useProjectionView(onSourceChange?: (source: FetchSource) => void) {
  const [modelName, setModelName] = useState("geneformer");
  const [selectedCellType, setSelectedCellType] = useState("All");
  const [diseaseActivity, setDiseaseActivity] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthyData, setHealthyData] = useState<EmbeddingResponse | null>(null);
  const [diseaseData, setDiseaseData] = useState<ProjectionResponse | null>(null);
  const [source, setSource] = useState<FetchSource>("unknown");

  const onSourceChangeRef = useRef(onSourceChange);
  onSourceChangeRef.current = onSourceChange;

  const reportSource = useCallback((next: FetchSource) => {
    setSource(next);
    onSourceChangeRef.current?.(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
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
          fetcher(healthyUrl, EmbeddingResponseSchema),
          fetcher(diseaseUrl, ProjectionResponseSchema),
        ]);
        if (cancelled) {
          return;
        }
        setHealthyData(healthyResult.data);
        setDiseaseData(diseaseResult.data);
        reportSource(diseaseResult.source);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof FetchError ? e.message : "Failed to load projections";
        setError(message);
        setHealthyData(null);
        setDiseaseData(null);
        reportSource("unknown");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [diseaseActivity, modelName, reportSource, selectedCellType]);

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
    setModelName,
    selectedCellType,
    setSelectedCellType,
    diseaseActivity,
    setDiseaseActivity,
    loading,
    error,
    healthyData,
    diseaseData,
    source,
    cellTypes,
  };
}
