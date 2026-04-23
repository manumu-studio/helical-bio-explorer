// Horizontal progress bar — purely presentational, driven by the `bars` prop.
// The caller precomputes env-specific color classes, phase labels, and any
// separator glyphs (turnaround marker for the request trace, phase dividers
// for the pipeline trace).

"use client";

import { useState } from "react";

import type { TraceProgressProps } from "./TraceProgress.types";

export function TraceProgress({ bars, currentStep, onGoTo }: TraceProgressProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-0.5">
      <span className="mr-1 text-[10px] font-medium text-[var(--text-secondary)]">→</span>

      {bars.map((bar, i) => {
        const isActive = i === currentStep;
        const isPast = i < currentStep;

        function handleBarClick() {
          if (isActive && bar.href !== null) {
            window.open(bar.href, "_blank", "noopener");
          } else if (!isActive) {
            onGoTo(i);
          }
        }

        return (
          <span key={bar.key} className="relative flex flex-1 items-center gap-0.5">
            {bar.separatorBefore !== null ? (
              <span className={`mx-0.5 text-[10px] ${bar.separatorBefore.colorClass}`}>
                {bar.separatorBefore.icon}
              </span>
            ) : null}

            <button
              type="button"
              onClick={handleBarClick}
              onMouseEnter={() => { setHoveredBar(i); }}
              onMouseLeave={() => { setHoveredBar(null); }}
              className="relative w-full cursor-pointer py-1.5"
              aria-label={bar.ariaLabel}
            >
              <div
                className={`h-2 w-full rounded-full transition-all duration-300 ${
                  isActive
                    ? `${bar.barActiveClass} scale-y-150 shadow-sm`
                    : isPast
                      ? bar.barPastClass
                      : "bg-[var(--border)]"
                }`}
              />
            </button>

            {hoveredBar === i ? (
              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-xl">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[var(--border)]" />
                <div className="flex items-center gap-1.5">
                  {isActive ? <span className="text-emerald-500 dark:text-emerald-400">★</span> : null}
                  <span className={`font-semibold ${bar.textClass}`}>
                    {bar.phaseLabel} {bar.label}
                  </span>
                  <span className="text-[var(--text-secondary)]">·</span>
                  <span className="text-[var(--text-primary)]">{bar.title}</span>
                </div>
                {bar.file !== null ? (
                  <div className="mt-1 truncate font-mono text-[10px] text-[var(--text-secondary)]">
                    {bar.file}
                  </div>
                ) : null}
                <div className={`mt-1.5 font-medium ${isActive ? "text-[var(--accent-indigo)]" : "text-[var(--text-secondary)]"}`}>
                  {isActive
                    ? bar.href !== null
                      ? "Click to open in GitHub ↗"
                      : bar.noFileHint
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
