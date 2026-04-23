// Orchestrator for the pipeline-trace visualization — owns layout, keyboard
// shortcuts, and threads together the shared PACKET-07 components (TraceProgress,
// TraceMinimap, RequestContextDisplay) with pipeline-specific data + the
// pipeline-specific PipelineCheckpointCard detail panel.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PipelineCheckpointCard } from "@/components/PipelineCheckpointCard";
import { PipelineTraceInfo } from "@/components/PipelineTraceInfo";
import { RequestContextDisplay } from "@/components/RequestContextDisplay";
import { TraceMinimap } from "@/components/TraceMinimap";
import { TraceProgress } from "@/components/TraceProgress";
import {
  PHASE_LABELS,
  PHASE_SHORT_LABELS,
  buildPipelineTraceBars,
  buildPipelineTraceMinimapItems,
} from "@/lib/pipeline-trace";

import type { PipelineTraceProps } from "./PipelineTrace.types";
import { usePipelineTrace } from "./usePipelineTrace";

const ARTIFACT_TOOLTIP =
  "Artifacts produced as the pipeline runs — each parquet, joblib, and provenance row is appended here as Colab and S3 steps complete.";

export function PipelineTrace({ className }: PipelineTraceProps) {
  const {
    currentStep,
    checkpoint,
    totalSteps,
    isFirst,
    isLast,
    currentPhase,
    cumulativeArtifacts,
    artifactsOpen,
    next,
    prev,
    goTo,
    reset,
    toggleArtifacts,
  } = usePipelineTrace();

  const [minimapCollapsed, setMinimapCollapsed] = useState(false);
  const [artifactsCollapsed, setArtifactsCollapsed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Toggles the artifact sidebar and guarantees the panel is expanded on reveal.
  const revealArtifacts = useCallback(() => {
    setArtifactsCollapsed((prev) => {
      const next = !prev;
      if (!next && !artifactsOpen) toggleArtifacts();
      return next;
    });
  }, [artifactsOpen, toggleArtifacts]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "r" || e.key === "R") {
        reset();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [next, prev, reset]);

  const bars = useMemo(() => buildPipelineTraceBars(), []);
  const minimapItems = useMemo(() => buildPipelineTraceMinimapItems(), []);

  if (checkpoint === null || currentPhase === null) return null;

  return (
    <div
      className={`flex h-full flex-col gap-4 bg-[var(--bg-base)] p-4 text-[var(--text-primary)] ${className ?? ""}`}
    >
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h1 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Pipeline Trace
            <span className="text-xs font-normal text-[var(--text-secondary)]">
              {String(totalSteps)} spans · dataset → parquet
            </span>
            <button
              type="button"
              onClick={() => { setInfoOpen(true); }}
              className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              aria-label="About this trace"
              title="About this trace"
            >
              ?
            </button>
          </h1>
          <span className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span className="rounded-full bg-[var(--accent-indigo)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-indigo)]">
              {PHASE_SHORT_LABELS[currentPhase]}
            </span>
            {PHASE_LABELS[currentPhase]} · Step {String(currentStep + 1)} of {String(totalSteps)}
          </span>
        </div>

        <TraceProgress bars={bars} currentStep={currentStep} onGoTo={goTo} />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={next}
            disabled={isLast}
            className="rounded-lg bg-[var(--accent-indigo)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            Reset
          </button>
          <span className="ml-auto text-xs text-[var(--text-secondary)]">
            Arrow keys or Space to navigate · R to reset
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className={`shrink-0 transition-all duration-300 ${minimapCollapsed ? "w-12" : "w-56"}`}>
          <TraceMinimap
            items={minimapItems}
            currentStep={currentStep}
            onGoTo={goTo}
            collapsed={minimapCollapsed}
            onToggle={() => { setMinimapCollapsed((p) => !p); }}
            headerLabel="Pipeline Map"
            initialSectionHeader={PHASE_SHORT_LABELS["pbmc-reference"]}
          />
        </div>

        <div className="min-h-0 max-h-[90vh] flex-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <PipelineCheckpointCard
            checkpoint={checkpoint}
            onRevealArtifacts={revealArtifacts}
          />
        </div>

        <div className={`shrink-0 transition-all duration-300 ${artifactsCollapsed ? "w-12" : "w-72"}`}>
          {artifactsCollapsed ? (
            <button
              type="button"
              onClick={() => { setArtifactsCollapsed(false); }}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 shadow-sm transition-colors hover:bg-[var(--bg-elevated)]"
              aria-label="Expand Artifact Accumulator"
            >
              <span className="text-sm" aria-hidden>📦</span>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                {cumulativeArtifacts.length}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">›</span>
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setArtifactsCollapsed(true); }}
                className="absolute -left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-base)] text-[10px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                aria-label="Collapse Artifact Accumulator"
              >
                ‹
              </button>
              <RequestContextDisplay
                entries={cumulativeArtifacts}
                isOpen={artifactsOpen}
                onToggle={toggleArtifacts}
                title="Artifact Accumulator"
                emoji="📦"
                tooltipText={ARTIFACT_TOOLTIP}
                emptyText="Empty — pipeline not yet started"
              />
            </div>
          )}
        </div>
      </div>

      <PipelineTraceInfo open={infoOpen} onClose={() => { setInfoOpen(false); }} />
    </div>
  );
}
