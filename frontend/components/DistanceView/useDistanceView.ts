// Fetches summary + scores; filters by selection store; builds heatmap aggregates.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DistanceViewState } from "@/components/DistanceView/DistanceView.types";
import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { normalizeSeverity, type SeverityBucket } from "@/lib/dashboard/conditions";
import { FetchError, type FetchSource } from "@/lib/fetcher";
import { fetchJsonOrNotFound } from "@/lib/fetchJson";
import { resolveCanonicalCellType } from "@/lib/constants/cellTypeColors";
import { ScoresResponseSchema } from "@/lib/schemas/scores";
import { SummaryResponseSchema } from "@/lib/schemas/summary";
import { isCellTypeVisible, useSelectionStore } from "@/lib/stores/useSelectionStore";

const HEATMAP_ROWS: SeverityBucket[] = ["healthy", "mild", "severe"];

export interface HeatmapDatum {
  x: string;
  /** Mean distance (Geneformer). */
  y: number;
  count: number;
}

export interface HeatmapRow {
  id: string;
  data: HeatmapDatum[];
}

export function useDistanceView(onSourceChange?: (source: FetchSource) => void) {
  const activeCellTypes = useSelectionStore((s) => s.activeCellTypes);

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

  const filteredScoreCells = useMemo(() => {
    if (scoresData === null) {
      return [];
    }
    return scoresData.cells.filter((c) => {
      const canon = resolveCanonicalCellType(c.cell_type);
      if (canon === null) {
        return true;
      }
      return isCellTypeVisible(canon, activeCellTypes);
    });
  }, [activeCellTypes, scoresData]);

  const heatmapRows = useMemo((): HeatmapRow[] => {
    const cells = filteredScoreCells;
    if (cells.length === 0) {
      return [];
    }
    const columns = Array.from(new Set(cells.map((c) => c.cell_type))).sort((a, b) => a.localeCompare(b));
    const buckets = new Map<string, { sum: number; n: number }>();
    for (const c of cells) {
      const sev = normalizeSeverity(c.disease_activity);
      if (sev === null) {
        continue;
      }
      const key = `${sev}\u0000${c.cell_type}`;
      const prev = buckets.get(key) ?? { sum: 0, n: 0 };
      prev.sum += c.distance_geneformer;
      prev.n += 1;
      buckets.set(key, prev);
    }
    return HEATMAP_ROWS.map((row) => ({
      id: row,
      data: columns.map((col) => {
        const b = buckets.get(`${row}\u0000${col}`);
        const count = b?.n ?? 0;
        const sum = b?.sum ?? 0;
        const y = count > 0 ? sum / count : 0;
        return { x: col, y, count };
      }),
    }));
  }, [filteredScoreCells]);

  const filteredGroups = useMemo(() => {
    if (summaryData === null) {
      return [];
    }
    return summaryData.groups;
  }, [summaryData]);

  return {
    viewState,
    scoresData,
    summaryData,
    cellTypes,
    filteredGroups,
    filteredScoreCells,
    heatmapRows,
  };
}
