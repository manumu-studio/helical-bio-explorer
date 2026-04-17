// Fetches full summary aggregates and sampled per-cell scores; cell-type filter is client-side.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DistanceViewState } from "@/components/DistanceView/DistanceView.types";
import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, type FetchSource } from "@/lib/fetcher";
import { fetchJsonOrNotFound } from "@/lib/fetchJson";
import { ScoresResponseSchema } from "@/lib/schemas/scores";
import { SummaryResponseSchema } from "@/lib/schemas/summary";

export function useDistanceView(onSourceChange?: (source: FetchSource) => void) {
  const [selectedCellType, setSelectedCellType] = useState("All");
  const [viewState, setViewState] = useState<DistanceViewState>({ status: "loading" });

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
        const summaryUrl = `${base}/api/v1/summary/covid_wilk`;
        const scoresUrl = `${base}/api/v1/scores/covid_wilk?sample_size=5000`;
        const [summaryResult, scoresResult] = await Promise.all([
          fetchJsonOrNotFound(summaryUrl, SummaryResponseSchema),
          fetchJsonOrNotFound(scoresUrl, ScoresResponseSchema),
        ]);
        if (cancelled) {
          return;
        }
        if (summaryResult.status === "not_found" || scoresResult.status === "not_found") {
          setViewState({ status: "not_found" });
          reportSource("unknown");
          return;
        }
        setViewState({
          status: "ready",
          summaryData: summaryResult.data,
          scoresData: scoresResult.data,
          source: scoresResult.source,
        });
        reportSource(scoresResult.source);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof FetchError ? e.message : "Failed to load distance data";
        setViewState({ status: "error", message });
        reportSource("unknown");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reportSource]);

  const summaryData = viewState.status === "ready" ? viewState.summaryData : null;
  const scoresData = viewState.status === "ready" ? viewState.scoresData : null;

  const cellTypes = useMemo(() => {
    const unique = new Set<string>();
    summaryData?.groups.forEach((g) => {
      unique.add(g.cell_type);
    });
    scoresData?.cells.forEach((c) => {
      unique.add(c.cell_type);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [scoresData, summaryData]);

  const filteredGroups = useMemo(() => {
    if (summaryData === null) {
      return [];
    }
    if (selectedCellType === "All") {
      return summaryData.groups;
    }
    return summaryData.groups.filter((g) => g.cell_type === selectedCellType);
  }, [selectedCellType, summaryData]);

  const filteredScoreCells = useMemo(() => {
    if (scoresData === null) {
      return [];
    }
    if (selectedCellType === "All") {
      return scoresData.cells;
    }
    return scoresData.cells.filter((c) => c.cell_type === selectedCellType);
  }, [scoresData, selectedCellType]);

  return {
    selectedCellType,
    setSelectedCellType,
    viewState,
    summaryData,
    scoresData,
    cellTypes,
    filteredGroups,
    filteredScoreCells,
  };
}
