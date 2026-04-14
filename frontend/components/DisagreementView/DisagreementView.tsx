// View 4: cells plotted by mean distance vs cross-model disagreement, colored by cell type.

"use client";

import { useMemo } from "react";
import type { Data } from "plotly.js";

import type { DisagreementViewProps } from "@/components/DisagreementView/DisagreementView.types";
import { useDisagreementView } from "@/components/DisagreementView/useDisagreementView";
import { FilterPanel } from "@/components/FilterPanel";
import { UmapScatter } from "@/components/UmapScatter";
import { getCellColor } from "@/lib/constants/cell-colors";

export function DisagreementView({ onSourceChange }: DisagreementViewProps) {
  const {
    selectedCellType,
    setSelectedCellType,
    diseaseActivity,
    setDiseaseActivity,
    loading,
    error,
    data,
    cellTypes,
  } = useDisagreementView(onSourceChange);

  const traces: Data[] = useMemo(() => {
    if (data === null || data.cells.length === 0) {
      return [];
    }
    const cells = data.cells;
    return [
      {
        type: "scattergl",
        mode: "markers",
        name: "Cells",
        x: cells.map((c) => (c.distance_geneformer + c.distance_genept) / 2),
        y: cells.map((c) => c.disagreement),
        marker: {
          size: 6,
          color: cells.map((c) => getCellColor(c.cell_type)),
        },
        text: cells.map(
          (c) =>
            `cell_id: ${c.cell_id}<br>cell_type: ${c.cell_type}<br>disease_activity: ${c.disease_activity}<br>distance_geneformer: ${String(c.distance_geneformer)}<br>distance_genept: ${String(c.distance_genept)}<br>disagreement: ${String(c.disagreement)}`,
        ),
        hoverinfo: "text",
      },
    ];
  }, [data]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        {loading ? (
          <div className="flex h-[520px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900/40 text-slate-400">
            Loading…
          </div>
        ) : null}
        {error !== null && !loading ? (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {!loading && error === null && data !== null ? (
          <UmapScatter
            traces={traces}
            title="Cross-model disagreement vs mean distance"
            xLabel="Mean distance (GF + GenePT) / 2"
            yLabel="Disagreement"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <FilterPanel
          modelName="geneformer"
          onModelChange={() => undefined}
          showModel={false}
          cellTypes={cellTypes}
          selectedCellType={selectedCellType}
          onCellTypeChange={setSelectedCellType}
          showDiseaseActivity
          diseaseActivity={diseaseActivity}
          onDiseaseActivityChange={setDiseaseActivity}
        />
        {data !== null ? (
          <div
            className="rounded-lg border border-slate-700 p-4 text-sm text-slate-200"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <p className="mb-2 font-medium text-slate-100">Stats</p>
            <ul className="space-y-1 text-slate-300">
              <li>Total cells: {data.total_cells.toLocaleString()}</li>
              <li>Sampled: {data.sampled.toLocaleString()}</li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
