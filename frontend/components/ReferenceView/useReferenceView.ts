// Fetches healthy reference embeddings and tracks model / cell-type filter state.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ReferenceViewState } from "@/components/ReferenceView/ReferenceView.types";
import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, type FetchSource } from "@/lib/fetcher";
import { fetchJsonOrNotFound } from "@/lib/fetchJson";
import { EmbeddingResponseSchema } from "@/lib/schemas/embeddings";

export function useReferenceView(
  onSourceChange: ((source: FetchSource) => void) | undefined,
  modelName: string,
  onModelNameChange: (name: string) => void,
) {
  const [selectedCellType, setSelectedCellType] = useState("All");
  const [viewState, setViewState] = useState<ReferenceViewState>({ status: "loading" });

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
        const url = `${base}/api/v1/embeddings/pbmc3k/${modelName}?sample_size=5000`;
        const result = await fetchJsonOrNotFound(url, EmbeddingResponseSchema);
        if (cancelled) {
          return;
        }
        if (result.status === "not_found") {
          setViewState({ status: "not_found" });
          reportSource("unknown");
          return;
        }
        setViewState({
          status: "ready",
          data: result.data,
          source: result.source,
        });
        reportSource(result.source);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof FetchError ? e.message : "Failed to load embeddings";
        setViewState({ status: "error", message });
        reportSource("unknown");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [modelName, reportSource]);

  const data = viewState.status === "ready" ? viewState.data : null;

  const cellTypes = useMemo(() => {
    if (data === null) {
      return [] as string[];
    }
    const unique = new Set(data.cells.map((c) => c.cell_type));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredCells = useMemo(() => {
    if (data === null) {
      return [];
    }
    if (selectedCellType === "All") {
      return data.cells;
    }
    return data.cells.filter((c) => c.cell_type === selectedCellType);
  }, [data, selectedCellType]);

  const cellTypeCount = useMemo(() => {
    if (data === null) {
      return 0;
    }
    return new Set(data.cells.map((c) => c.cell_type)).size;
  }, [data]);

  return {
    modelName,
    setModelName: onModelNameChange,
    selectedCellType,
    setSelectedCellType,
    viewState,
    data,
    cellTypes,
    filteredCells,
    cellTypeCount,
  };
}
