// Gray pulsing rectangles matching UMAP vs bar chart layout regions.

import type { ChartSkeletonProps } from "@/components/ChartSkeleton/ChartSkeleton.types";

export function ChartSkeleton({ variant }: ChartSkeletonProps) {
  if (variant === "umap") {
    return (
      <div
        className="h-[520px] w-full max-w-[520px] animate-pulse rounded-lg border border-slate-700 bg-slate-800/80"
        aria-hidden
      />
    );
  }
  return (
    <div
      className="h-[420px] w-full animate-pulse rounded-lg border border-slate-700 bg-slate-800/80"
      aria-hidden
    />
  );
}
