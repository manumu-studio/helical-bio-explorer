// Right column: selection summary, type breakdown bar, avg divergence, TanStack table (max 500 rows).

"use client";

import { flexRender } from "@tanstack/react-table";
import { useReducedMotion } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

import type { SelectedCellsPanelProps } from "@/components/dashboard/SelectedCellsPanel/SelectedCellsPanel.types";
import { useSelectedCellsTable } from "@/components/dashboard/SelectedCellsPanel/useSelectedCellsTable";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CELL_TYPE_COLORS,
  colorForCellType,
  resolveCanonicalCellType,
} from "@/lib/constants/cellTypeColors";
import { useSelectionStore } from "@/lib/stores/useSelectionStore";

const MAX_ROWS = 500;

export function SelectedCellsPanel({ rows }: SelectedCellsPanelProps) {
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const setHoveredCellId = useSelectionStore((s) => s.setHoveredCellId);
  const selectedCellIds = useSelectionStore((s) => s.selectedCellIds);
  const reduceMotion = useReducedMotion();

  const sortedRows = useMemo(() => {
    return [...rows]
      .sort((a, b) => {
        const da = a.divergence ?? Number.NEGATIVE_INFINITY;
        const db = b.divergence ?? Number.NEGATIVE_INFINITY;
        return db - da;
      })
      .slice(0, MAX_ROWS);
  }, [rows]);

  const { table } = useSelectedCellsTable(sortedRows);

  const avgDiv =
    rows.length === 0
      ? null
      : (() => {
          const nums = rows.map((r) => r.divergence).filter((v): v is number => v !== null && !Number.isNaN(v));
          if (nums.length === 0) {
            return null;
          }
          return nums.reduce((a, b) => a + b, 0) / nums.length;
        })();

  const breakdown = (() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      m.set(r.cell_type, (m.get(r.cell_type) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  })();

  const slide = reduceMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" as const };

  return (
    <TooltipProvider>
      <AnimatePresence mode="wait">
        {selectedCellIds.length > 0 ? (
          <motion.aside
            key="panel"
            initial={reduceMotion ? { x: 0, opacity: 1 } : { x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: 320, opacity: 0 }}
            transition={slide}
            className="flex h-full min-h-0 flex-col gap-3 overflow-hidden border-l border-[var(--border)] bg-[var(--bg-card)] px-3 pb-3 pt-0"
            aria-label="Selected cells"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {rows.length} cells selected
              </p>
              <Button type="button" variant="ghost" size="icon" aria-label="Clear selection" onClick={clearSelection}>
                ✕
              </Button>
            </div>

            {rows.length > MAX_ROWS ? (
              <p className="rounded-md border border-amber-800/60 bg-amber-950/40 px-2 py-1 text-xs text-amber-100">
                Showing top {MAX_ROWS} — refine selection
              </p>
            ) : null}

            <div>
              <p className="mb-1 text-xs text-[var(--text-secondary)]">By cell type</p>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                {breakdown.map(([ct, n]) => {
                  const w = rows.length > 0 ? (n / rows.length) * 100 : 0;
                  const canon = resolveCanonicalCellType(ct);
                  const bg = canon !== null ? CELL_TYPE_COLORS[canon] : colorForCellType(ct);
                  return (
                    <div
                      key={ct}
                      style={{ width: `${w}%`, backgroundColor: bg }}
                      title={`${ct}: ${n}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2">
              <p className="text-xs text-[var(--text-secondary)]">Avg divergence</p>
              <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                {avgDiv === null ? "—" : avgDiv.toFixed(4)}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-[var(--border)]">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th key={h.id} className="border-b border-[var(--border)] px-2 py-2 font-medium">
                          {h.isPlaceholder ? null : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                              onClick={h.column.getToggleSortingHandler()}
                            >
                              {flexRender(h.column.columnDef.header, h.getContext())}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="text-[var(--text-primary)]">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)]"
                      onMouseEnter={() => {
                        setHoveredCellId(row.original.cell_id);
                      }}
                      onMouseLeave={() => {
                        setHoveredCellId(null);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-2 py-1.5 align-top">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </TooltipProvider>
  );
}
