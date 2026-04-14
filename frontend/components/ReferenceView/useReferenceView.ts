// Fetches healthy reference embeddings and tracks model / cell-type filter state.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, fetcher, type FetchSource } from "@/lib/fetcher";
import {
  EmbeddingResponseSchema,
  type EmbeddingResponse,
} from "@/lib/schemas/embeddings";

export function useReferenceView(onSourceChange?: (source: FetchSource) => void) {
  const [modelName, setModelName] = useState("geneformer");
  const [selectedCellType, setSelectedCellType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EmbeddingResponse | null>(null);
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
        const url = `${base}/api/v1/embeddings/pbmc3k/${modelName}?sample_size=5000`;
        const result = await fetcher(url, EmbeddingResponseSchema);
        if (cancelled) {
          return;
        }
        setData(result.data);
        reportSource(result.source);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof FetchError ? e.message : "Failed to load embeddings";
        setError(message);
        setData(null);
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
  }, [modelName, reportSource]);

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
    setModelName,
    selectedCellType,
    setSelectedCellType,
    loading,
    error,
    data,
    source,
    cellTypes,
    filteredCells,
    cellTypeCount,
  };
}
