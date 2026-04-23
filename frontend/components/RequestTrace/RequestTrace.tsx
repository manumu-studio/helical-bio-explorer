// Orchestrator for the request-trace visualization — owns layout, keyboard
// shortcuts, and the state that threads together the extracted sub-components.

"use client";

import { useCallback, useEffect, useState } from "react";

import { CheckpointCard } from "@/components/CheckpointCard";
import { RequestContextDisplay } from "@/components/RequestContextDisplay";
import { RequestTraceInfo } from "@/components/RequestTraceInfo";
import { TraceMinimap } from "@/components/TraceMinimap";
import { TraceProgress } from "@/components/TraceProgress";
import { OUTBOUND_COUNT, RETURN_COUNT, TURNAROUND_STEP, getDisplayInfo } from "@/lib/request-trace";

import type { RequestTraceProps } from "./RequestTrace.types";
import { useRequestTrace } from "./useRequestTrace";

export function RequestTrace({ className }: RequestTraceProps) {
  const {
    currentStep,
    checkpoint,
    totalSteps,
    isFirst,
    isLast,
    cumulativeBackpack,
    backpackOpen,
    next,
    prev,
    goTo,
    reset,
    toggleBackpack,
  } = useRequestTrace();

  const [minimapCollapsed, setMinimapCollapsed] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // Toggles the context sidebar and guarantees the backpack is open on reveal.
  const revealContext = useCallback(() => {
    setContextCollapsed((prev) => {
      const next = !prev;
      if (!next && !backpackOpen) toggleBackpack();
      return next;
    });
  }, [backpackOpen, toggleBackpack]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't swallow keystrokes while the user is typing in an input.
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

  const headerDisplay = checkpoint !== null ? getDisplayInfo(checkpoint.step) : null;

  if (checkpoint === null || headerDisplay === null) return null;

  return (
    <div
      className={`flex h-full flex-col gap-4 bg-[var(--bg-base)] p-4 text-[var(--text-primary)] ${className ?? ""}`}
    >
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h1 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Request Trace
            <span className="text-xs font-normal text-[var(--text-secondary)]">
              {String(OUTBOUND_COUNT + RETURN_COUNT)} spans · click → render
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
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                currentStep < TURNAROUND_STEP
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {currentStep < TURNAROUND_STEP ? "→ Outbound" : "← Return"}
            </span>
            {headerDisplay.phaseLabel} · Step {String(headerDisplay.phaseStep)} of {String(headerDisplay.phaseTotal)}
          </span>
        </div>

        <TraceProgress currentStep={currentStep} totalSteps={totalSteps} onGoTo={goTo} />

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
            currentStep={currentStep}
            onGoTo={goTo}
            collapsed={minimapCollapsed}
            onToggle={() => { setMinimapCollapsed((p) => !p); }}
          />
        </div>

        <div className="min-h-0 max-h-[90vh] flex-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <CheckpointCard
            checkpoint={checkpoint}
            currentStep={currentStep}
            onRevealContext={revealContext}
          />
        </div>

        <div className={`shrink-0 transition-all duration-300 ${contextCollapsed ? "w-12" : "w-72"}`}>
          {contextCollapsed ? (
            <button
              type="button"
              onClick={() => { setContextCollapsed(false); }}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 shadow-sm transition-colors hover:bg-[var(--bg-elevated)]"
              aria-label="Expand Request Context"
            >
              <span className="text-sm" aria-hidden>🧭</span>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                {cumulativeBackpack.length}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">›</span>
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setContextCollapsed(true); }}
                className="absolute -left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-base)] text-[10px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                aria-label="Collapse Request Context"
              >
                ‹
              </button>
              <RequestContextDisplay
                entries={cumulativeBackpack}
                isOpen={backpackOpen}
                onToggle={toggleBackpack}
              />
            </div>
          )}
        </div>
      </div>

      <RequestTraceInfo open={infoOpen} onClose={() => { setInfoOpen(false); }} />
    </div>
  );
}
