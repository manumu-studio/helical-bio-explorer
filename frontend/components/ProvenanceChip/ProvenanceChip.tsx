// Small pill indicating whether the last API response came from S3 or local parquet fallback.

"use client";

import type { ProvenanceChipProps } from "@/components/ProvenanceChip/ProvenanceChip.types";

export function ProvenanceChip({ source }: ProvenanceChipProps) {
  const config =
    source === "s3"
      ? { dot: "bg-emerald-400", label: "S3" }
      : source === "local"
        ? { dot: "bg-amber-400", label: "Local" }
        : { dot: "bg-slate-400", label: "—" };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-200">
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden />
      <span className="font-medium">{config.label}</span>
    </span>
  );
}
