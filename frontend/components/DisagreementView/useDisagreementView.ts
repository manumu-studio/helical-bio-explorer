// Fetches sampled disagreement rows; optional cell-type and disease-activity query filters.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, fetcher, type FetchSource } from "@/lib/fetcher";
import {
  DisagreementResponseSchema,
  type DisagreementResponse,
} from "@/lib/schemas/disagreement";

export function useDisagreementView(onSourceChange?: (source: FetchSource) => void) {
  const [selectedCellType, setSelectedCellType] = useState("All");
  const [diseaseActivity, setDiseaseActivity] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DisagreementResponse | null>(null);
  const [source, setSource] = useState<FetchSource>("unknown");
  const [cellTypeCatalog, setCellTypeCatalog] = useState<string[]>([]);

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
        const params = new URLSearchParams();
        params.set("sample_size", "5000");
        if (selectedCellType !== "All") {
          params.set("cell_type", selectedCellType);
        }
        if (diseaseActivity !== "All") {
          params.set("disease_activity", diseaseActivity);
        }
        const url = `${base}/api/v1/disagreement/covid_wilk?${params.toString()}`;
        const result = await fetcher(url, DisagreementResponseSchema);
        if (cancelled) {
          return;
        }
        setData(result.data);
        reportSource(result.source);
        if (selectedCellType === "All" && diseaseActivity === "All") {
          const unique = Array.from(new Set(result.data.cells.map((c) => c.cell_type))).sort((a, b) =>
            a.localeCompare(b),
          );
          setCellTypeCatalog(unique);
        }
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof FetchError ? e.message : "Failed to load disagreement data";
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
  }, [diseaseActivity, reportSource, selectedCellType]);

  const cellTypes = useMemo(() => {
    if (cellTypeCatalog.length > 0) {
      return cellTypeCatalog;
    }
    if (data === null) {
      return [] as string[];
    }
    const unique = new Set(data.cells.map((c) => c.cell_type));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [cellTypeCatalog, data]);

  return {
    selectedCellType,
    setSelectedCellType,
    diseaseActivity,
    setDiseaseActivity,
    loading,
    error,
    data,
    source,
    cellTypes,
  };
}
