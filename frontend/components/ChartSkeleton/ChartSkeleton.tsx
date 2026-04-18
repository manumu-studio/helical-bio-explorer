// Skeleton loaders: UMAP canvas, Distance heatmap table + scatter, generic bar.

"use client";

import { DistanceHeatmapSkeleton } from "@/components/ChartSkeleton/DistanceHeatmapSkeleton";
import { DistanceScatterSkeleton } from "@/components/ChartSkeleton/DistanceScatterSkeleton";
import type { ChartSkeletonProps } from "@/components/ChartSkeleton/ChartSkeleton.types";
import { UmapLoadingCanvas } from "@/components/ChartSkeleton/UmapLoadingCanvas";

export function ChartSkeleton({ variant }: ChartSkeletonProps) {
  if (variant === "umap") {
    return (
      <div
        className="motion-safe:animate-pulse flex h-full min-h-0 w-full min-w-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
        aria-hidden
        role="status"
      >
        <UmapLoadingCanvas />
        <p className="shrink-0 py-2 text-center text-sm text-[var(--text-secondary)]">
          Loading UMAP embedding...
        </p>
      </div>
    );
  }

  if (variant === "heatmap") {
    return <DistanceHeatmapSkeleton />;
  }

  if (variant === "scatter") {
    return <DistanceScatterSkeleton />;
  }

  return (
    <div
      className="h-[420px] w-full animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg-card)]"
      aria-hidden
      role="status"
    />
  );
}
