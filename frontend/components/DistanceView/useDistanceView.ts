// Fetches full summary aggregates and sampled per-cell scores; cell-type filter is client-side.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, fetcher, type FetchSource } from "@/lib/fetcher";
import { ScoresResponseSchema, type ScoresResponse } from "@/lib/schemas/scores";
import { SummaryResponseSchema, type SummaryResponse } from "@/lib/schemas/summary";

export function useDistanceView(onSourceChange?: (source: FetchSource) => void) {
  const [selectedCellType, setSelectedCellType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [scoresData, setScoresData] = useState<ScoresResponse | null>(null);
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
        const summaryUrl = `${base}/api/v1/summary/sle_csle`;
        const scoresUrl = `${base}/api/v1/scores/sle_csle?sample_size=5000`;
        const [summaryResult, scoresResult] = await Promise.all([
          fetcher(summaryUrl, SummaryResponseSchema),
          fetcher(scoresUrl, ScoresResponseSchema),
        ]);
        if (cancelled) {
          return;
        }
        setSummaryData(summaryResult.data);
        setScoresData(scoresResult.data);
        reportSource(scoresResult.source);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof FetchError ? e.message : "Failed to load distance data";
        setError(message);
        setSummaryData(null);
        setScoresData(null);
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
  }, [reportSource]);

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
    loading,
    error,
    summaryData,
    scoresData,
    source,
    cellTypes,
    filteredGroups,
    filteredScoreCells,
  };
}
