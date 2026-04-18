// Fetches sampled disagreement rows; filters client-side via selection store.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DisagreementViewState } from "@/components/DisagreementView/DisagreementView.types";
import { getClientBackendBaseUrl } from "@/lib/backend-url";
import { FetchError, type FetchSource } from "@/lib/fetcher";
import { fetchJsonOrNotFound } from "@/lib/fetchJson";
import { DisagreementResponseSchema } from "@/lib/schemas/disagreement";
import type { DisagreementCell } from "@/lib/schemas/disagreement";
import { resolveCanonicalCellType } from "@/lib/constants/cellTypeColors";
import {
  isCellTypeVisible,
  isConditionVisible,
  useSelectionStore,
} from "@/lib/stores/useSelectionStore";

export function useDisagreementView(onSourceChange?: (source: FetchSource) => void) {
  const activeCellTypes = useSelectionStore((s) => s.activeCellTypes);
  const activeConditions = useSelectionStore((s) => s.activeConditions);
  const divergenceRange = useSelectionStore((s) => s.divergenceRange);
  const setDivergenceRange = useSelectionStore((s) => s.setDivergenceRange);

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
        const unique = Array.from(new Set(result.data.cells.map((c) => c.cell_type))).sort((a, b) =>
          a.localeCompare(b),
        );
        setCellTypeCatalog(unique);
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
  }, [reportSource]);

  const data = viewState.status === "ready" ? viewState.data : null;

  const disagreementInitRef = useRef(false);
  useEffect(() => {
    if (data === null || data.cells.length === 0 || disagreementInitRef.current) {
      return;
    }
    const vals = data.cells.map((c) => c.disagreement);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min <= max) {
      setDivergenceRange([min, max]);
      disagreementInitRef.current = true;
    }
  }, [data, setDivergenceRange]);

  const filteredCells = useMemo(() => {
    if (data === null) {
      return [] as DisagreementCell[];
    }
    const [r0, r1] = divergenceRange;
    return data.cells.filter((c) => {
      const canon = resolveCanonicalCellType(c.cell_type);
      if (canon !== null && !isCellTypeVisible(canon, activeCellTypes)) {
        return false;
      }
      if (!isConditionVisible(c.disease_activity, activeConditions)) {
        return false;
      }
      const d = c.disagreement;
      return d >= r0 && d <= r1;
    });
  }, [activeCellTypes, activeConditions, data, divergenceRange]);

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

  const divergenceBounds = useMemo(() => {
    if (data === null || data.cells.length === 0) {
      return { min: 0, max: 1 };
    }
    const vals = data.cells.map((c) => c.disagreement);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [data]);

  return {
    viewState,
    data,
    filteredCells,
    cellTypes,
    divergenceBounds,
  };
}
