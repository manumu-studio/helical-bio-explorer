// Loads healthy reference + disease projections; filters client-side via selection store.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ProjectionViewState } from "@/components/ProjectionView/ProjectionView.types";
import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, type FetchSource } from "@/lib/fetcher";
import { fetchJsonOrNotFound } from "@/lib/fetchJson";
import { EmbeddingResponseSchema } from "@/lib/schemas/embeddings";
import { ProjectionResponseSchema } from "@/lib/schemas/projections";
import type { ProjectedCell } from "@/lib/schemas/projections";
import { resolveCanonicalCellType } from "@/lib/constants/cellTypeColors";
import {
  isCellTypeVisible,
  isConditionVisible,
  useSelectionStore,
} from "@/lib/stores/useSelectionStore";

export function useProjectionView(
  onSourceChange: ((source: FetchSource) => void) | undefined,
  modelName: string,
  onModelNameChange: (name: string) => void,
) {
  const activeCellTypes = useSelectionStore((s) => s.activeCellTypes);
  const activeConditions = useSelectionStore((s) => s.activeConditions);
  const divergenceRange = useSelectionStore((s) => s.divergenceRange);
  const setDivergenceRange = useSelectionStore((s) => s.setDivergenceRange);

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
        const diseaseUrl = `${base}/api/v1/projections/covid_wilk/${modelName}?sample_size=5000`;
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
  }, [modelName, reportSource]);

  const healthyData = viewState.status === "ready" ? viewState.healthyData : null;
  const diseaseData = viewState.status === "ready" ? viewState.diseaseData : null;

  const divergenceInitRef = useRef(false);
  useEffect(() => {
    divergenceInitRef.current = false;
  }, [modelName]);

  useEffect(() => {
    if (diseaseData === null || diseaseData.cells.length === 0 || divergenceInitRef.current) {
      return;
    }
    const vals = diseaseData.cells.map((c) => c.distance_to_healthy);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min <= max) {
      setDivergenceRange([min, max]);
      divergenceInitRef.current = true;
    }
  }, [diseaseData, setDivergenceRange]);

  const filteredDiseaseCells = useMemo(() => {
    if (diseaseData === null) {
      return [] as ProjectedCell[];
    }
    const [r0, r1] = divergenceRange;
    return diseaseData.cells.filter((c) => {
      const canon = resolveCanonicalCellType(c.cell_type);
      if (canon !== null && !isCellTypeVisible(canon, activeCellTypes)) {
        return false;
      }
      if (!isConditionVisible(c.disease_activity, activeConditions)) {
        return false;
      }
      const d = c.distance_to_healthy;
      return d >= r0 && d <= r1;
    });
  }, [activeCellTypes, activeConditions, diseaseData, divergenceRange]);

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

  const divergenceBounds = useMemo(() => {
    if (diseaseData === null || diseaseData.cells.length === 0) {
      return { min: 0, max: 1 };
    }
    const vals = diseaseData.cells.map((c) => c.distance_to_healthy);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [diseaseData]);

  return {
    modelName,
    setModelName: onModelNameChange,
    viewState,
    healthyData,
    diseaseData,
    filteredDiseaseCells,
    cellTypes,
    divergenceBounds,
  };
}
