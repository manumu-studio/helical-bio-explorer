// Scatter-shaped loader for Geneformer vs GenePT agreement plot (distinct from heatmap/table).

export function DistanceScatterSkeleton() {
  const dotPositions: readonly { left: string; top: string }[] = [
    { left: "12%", top: "62%" },
    { left: "22%", top: "48%" },
    { left: "35%", top: "55%" },
    { left: "41%", top: "38%" },
    { left: "52%", top: "44%" },
    { left: "58%", top: "28%" },
    { left: "68%", top: "33%" },
    { left: "74%", top: "22%" },
    { left: "81%", top: "18%" },
    { left: "88%", top: "40%" },
  ];

  return (
    <div className="w-full" aria-hidden role="status">
      <div className="mb-2 h-4 w-52 max-w-[90%] rounded bg-[var(--bg-elevated)] motion-safe:animate-pulse" />
      <div className="relative h-[min(420px,50vh)] min-h-[260px] w-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="absolute inset-2 rounded-md bg-[var(--bg-elevated)]">
          <div className="relative h-full w-full p-3">
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text-secondary)]">
              Distance (Geneformer)
            </span>
            <span className="absolute top-1/2 left-1 -translate-y-1/2 -rotate-90 text-[10px] text-[var(--text-secondary)]">
              Distance (GenePT)
            </span>
            <div className="absolute inset-8 rounded border border-[var(--border)] bg-[var(--bg-base)]">
              <svg
                className="absolute inset-0 h-full w-full text-[var(--text-secondary)]"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <line
                  x1="8"
                  y1="92"
                  x2="92"
                  y2="8"
                  stroke="currentColor"
                  strokeWidth="0.35"
                  strokeDasharray="2 2"
                  opacity="0.45"
                />
              </svg>
              {dotPositions.map((pos, i) => (
                <div
                  key={i}
                  className="absolute h-1.5 w-1.5 rounded-full bg-[var(--accent-indigo)] motion-safe:animate-pulse"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    animationDelay: `${i * 80}ms`,
                    opacity: 0.35 + (i % 5) * 0.1,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--text-secondary)]">
        Loading per-cell scatter (model agreement)…
      </p>
    </div>
  );
}
