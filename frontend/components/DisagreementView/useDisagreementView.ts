// Fetches sampled disagreement rows; optional cell-type and disease-activity query filters.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DisagreementViewState } from "@/components/DisagreementView/DisagreementView.types";
import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, type FetchSource } from "@/lib/fetcher";
import { fetchJsonOrNotFound } from "@/lib/fetchJson";
import { DisagreementResponseSchema } from "@/lib/schemas/disagreement";

export function useDisagreementView(onSourceChange?: (source: FetchSource) => void) {
  const [selectedCellType, setSelectedCellType] = useState("All");
  const [diseaseActivity, setDiseaseActivity] = useState("All");
  const [viewState, setViewState] = useState<DisagreementViewState>({ status: "loading" });
  const [cellTypeCatalog, setCellTypeCatalog] = useState<string[]>([]);

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
        const params = new URLSearchParams();
        params.set("sample_size", "5000");
        if (selectedCellType !== "All") {
          params.set("cell_type", selectedCellType);
        }
        if (diseaseActivity !== "All") {
          params.set("disease_activity", diseaseActivity);
        }
        const url = `${base}/api/v1/disagreement/covid_wilk?${params.toString()}`;
        const result = await fetchJsonOrNotFound(url, DisagreementResponseSchema);
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
        setViewState({ status: "error", message });
        reportSource("unknown");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [diseaseActivity, reportSource, selectedCellType]);

  const data = viewState.status === "ready" ? viewState.data : null;

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
    viewState,
    data,
    cellTypes,
  };
}
