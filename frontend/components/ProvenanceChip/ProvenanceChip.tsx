// Pill indicating artifact source (S3 vs local) and optional precompute run metadata.

"use client";

import { formatDistanceToNow } from "date-fns";

import type { ProvenanceChipProps } from "@/components/ProvenanceChip/ProvenanceChip.types";

export function ProvenanceChip({ source, provenance }: ProvenanceChipProps) {
  const config =
    source === "s3"
      ? { dot: "bg-emerald-400", label: "S3" }
      : source === "local"
        ? { dot: "bg-amber-400", label: "Local" }
        : { dot: "bg-slate-400", label: "—" };

  const shortSha =
    provenance !== null && provenance.git_sha.length >= 7
      ? provenance.git_sha.slice(0, 7)
      : null;

  const relative =
    provenance !== null ? formatDistanceToNow(new Date(provenance.created_at), { addSuffix: true }) : null;

  return (
    <span className="group inline-flex max-w-full flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-200">
        <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} aria-hidden />
        <span className="font-medium">{config.label}</span>
        {provenance !== null ? (
          <>
            <span className="hidden text-slate-500 sm:inline" aria-hidden>
              ·
            </span>
            <span className="max-w-[14rem] truncate font-normal text-slate-300 group-hover:max-w-none sm:whitespace-nowrap">
              {provenance.model_name} {provenance.model_version}
              {shortSha !== null ? ` · ${shortSha}` : ""}
              {relative !== null ? ` · ${relative}` : ""}
            </span>
          </>
        ) : null}
      </span>
    </span>
  );
}
