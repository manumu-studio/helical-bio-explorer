// Reusable filter strip: model toggle, cell-type select, optional disease-activity toggle.

"use client";

import type { FilterPanelProps } from "@/components/FilterPanel/FilterPanel.types";

const MODELS = [
  { id: "geneformer", label: "Geneformer" },
  { id: "genept", label: "GenePT" },
] as const;

const DISEASE_OPTIONS = [
  { id: "All", label: "All" },
  { id: "healthy", label: "Healthy" },
  { id: "mild", label: "Mild" },
  { id: "severe", label: "Severe" },
] as const;

export function FilterPanel({
  modelName,
  onModelChange,
  showModel = true,
  cellTypes,
  selectedCellType,
  onCellTypeChange,
  showDiseaseActivity,
  diseaseActivity,
  onDiseaseActivityChange,
}: FilterPanelProps) {
  return (
    <aside
      className="flex flex-col gap-4 rounded-lg border border-slate-700 p-4"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      {showModel ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Model</p>
          <div className="flex gap-2">
            {MODELS.map((m) => {
              const active = modelName === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onModelChange(m.id);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "text-slate-900"
                      : "bg-slate-900/60 text-slate-200 hover:bg-slate-900"
                  }`}
                  style={
                    active
                      ? { backgroundColor: "var(--accent-indigo)", color: "#0f172a" }
                      : undefined
                  }
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Cell type</p>
        <select
          value={selectedCellType}
          onChange={(e) => {
            onCellTypeChange(e.target.value);
          }}
          className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          <option value="All">All</option>
          {cellTypes.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </div>

      {showDiseaseActivity ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Disease activity
          </p>
          <div className="flex flex-wrap gap-2">
            {DISEASE_OPTIONS.map((opt) => {
              const active = diseaseActivity === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onDiseaseActivityChange(opt.id);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "text-slate-900"
                      : "bg-slate-900/60 text-slate-200 hover:bg-slate-900"
                  }`}
                  style={
                    active
                      ? { backgroundColor: "var(--accent-indigo)", color: "#0f172a" }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
