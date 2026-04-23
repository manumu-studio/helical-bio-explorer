// Horizontal progress bar for the request trace — each segment is a clickable span.

"use client";

import { useState } from "react";

import {
  CHECKPOINTS,
  ENV_CONFIG,
  GITHUB_REPO,
  TURNAROUND_STEP,
  getDisplayInfo,
} from "@/lib/request-trace";

import type { TraceProgressProps } from "./TraceProgress.types";

export function TraceProgress({ currentStep, totalSteps, onGoTo }: TraceProgressProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-0.5">
      <span className="mr-1 text-[10px] font-medium text-[var(--text-secondary)]">→</span>

      {Array.from({ length: totalSteps }, (_, i) => {
        const cp = CHECKPOINTS[i];
        if (cp === undefined) return null;
        const envConf = ENV_CONFIG[cp.environment];
        const isActive = i === currentStep;
        const isPast = i < currentStep;
        const display = getDisplayInfo(cp.step);
        const hasFile = cp.file !== null;
        const githubUrl = hasFile ? `${GITHUB_REPO}/${cp.file}` : null;

        function handleBarClick() {
          if (isActive && githubUrl !== null) {
            window.open(githubUrl, "_blank", "noopener");
          } else if (!isActive) {
            onGoTo(i);
          }
        }

        return (
          <span key={i} className="relative flex flex-1 items-center gap-0.5">
            {i === TURNAROUND_STEP ? (
              <span className="mx-0.5 text-[10px] text-amber-500 dark:text-amber-400">⟳</span>
            ) : null}

            <button
              type="button"
              onClick={handleBarClick}
              onMouseEnter={() => { setHoveredBar(i); }}
              onMouseLeave={() => { setHoveredBar(null); }}
              className="relative w-full cursor-pointer py-1.5"
              aria-label={`Step ${display.label}: ${cp.title}`}
            >
              <div
                className={`h-2 w-full rounded-full transition-all duration-300 ${
                  isActive
                    ? `${envConf.barActive} scale-y-150 shadow-sm`
                    : isPast
                      ? envConf.barPast
                      : "bg-[var(--border)]"
                }`}
              />
            </button>

            {hoveredBar === i ? (
              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-xl">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[var(--border)]" />
                <div className="flex items-center gap-1.5">
                  {isActive ? <span className="text-emerald-500 dark:text-emerald-400">★</span> : null}
                  <span className={`font-semibold ${envConf.text}`}>
                    {display.phaseLabel} {display.label}
                  </span>
                  <span className="text-[var(--text-secondary)]">·</span>
                  <span className="text-[var(--text-primary)]">{cp.title.split(" — ")[0]}</span>
                </div>
                {hasFile ? (
                  <div className="mt-1 truncate font-mono text-[10px] text-[var(--text-secondary)]">
                    {cp.file}
                  </div>
                ) : null}
                <div className={`mt-1.5 font-medium ${isActive ? "text-[var(--accent-indigo)]" : "text-[var(--text-secondary)]"}`}>
                  {isActive
                    ? githubUrl !== null
                      ? "Click to open in GitHub ↗"
                      : "Network transit — no file"
                    : "Click to jump →"}
                </div>
              </div>
            ) : null}
          </span>
        );
      })}

      <span className="ml-1 text-[10px] font-medium text-[var(--text-secondary)]">←</span>
    </div>
  );
}
