// Heatmap-shaped loader: Condition × cell-type grid so Distance tab reads as “table loading”, not a chart.

export function DistanceHeatmapSkeleton() {
  const cols = 9;
  const rows = 3;
  const cells = rows * cols;

  return (
    <div
      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4"
      aria-hidden
      role="status"
    >
      <p className="mb-3 text-xs font-medium text-[var(--text-secondary)]">
        Loading mean distance table (condition × cell type)…
      </p>

      <div className="flex min-h-[240px] flex-col gap-2 sm:min-h-[260px] sm:flex-row sm:gap-3">
        <div className="flex w-full shrink-0 flex-row items-stretch gap-3 sm:w-28 sm:flex-col sm:justify-center sm:pt-10">
          <span className="w-16 shrink-0 pt-1 text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase sm:w-auto sm:pt-0">
            Condition
          </span>
          <div className="flex flex-1 flex-col justify-center gap-4 sm:gap-5">
            {(["healthy", "mild", "severe"] as const).map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span className="hidden w-14 shrink-0 text-[11px] text-[var(--text-primary)] sm:inline">
                  {label}
                </span>
                <div className="h-2.5 flex-1 rounded bg-[var(--bg-elevated)] motion-safe:animate-pulse sm:flex-none sm:w-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex justify-between gap-0.5 overflow-hidden pl-0.5">
            {Array.from({ length: cols }).map((_, i) => (
              <div
                key={i}
                className="flex min-w-0 flex-1 flex-col items-center justify-end"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="h-10 w-[85%] max-w-[2.75rem] -rotate-45 rounded-sm bg-[var(--bg-elevated)] motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
          <p className="mb-1.5 text-center text-[10px] font-medium text-[var(--text-secondary)]">Cell type</p>

          <div className="grid grid-cols-9 gap-px rounded-md border border-[var(--border)] bg-[var(--border)] p-px">
            {Array.from({ length: cells }).map((_, i) => (
              <div
                key={i}
                className="min-h-[2.25rem] rounded-[1px] bg-[var(--bg-elevated)] motion-safe:animate-pulse sm:min-h-[2.5rem]"
                style={{
                  animationDelay: `${(i % cols) * 35 + Math.floor(i / cols) * 100}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
