// Neutral copy when a view’s parquet artifact is missing (404), not a server failure.

import type { DashboardEmptyStateProps } from "@/components/DashboardEmptyState/DashboardEmptyState.types";

export function DashboardEmptyState({ viewName, dataset, model }: DashboardEmptyStateProps) {
  return (
    <div
      className="rounded-lg border border-slate-600/80 bg-slate-900/50 p-6 text-sm text-slate-300"
      role="status"
    >
      <p className="font-medium text-slate-100">
        This view needs the {viewName} precompute run.
      </p>
      <p className="mt-2">
        Run the notebook for {dataset} × {model} to populate it.
      </p>
      <p className="mt-2 text-slate-400">See the provenance panel for run status.</p>
    </div>
  );
}
