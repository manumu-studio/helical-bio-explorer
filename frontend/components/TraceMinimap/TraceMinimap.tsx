// Collapsible sidebar listing every request-trace span — outbound then return.

import {
  CHECKPOINTS,
  ENV_CONFIG,
  TURNAROUND_STEP,
  getDisplayInfo,
} from "@/lib/request-trace";

import type { TraceMinimapProps } from "./TraceMinimap.types";

export function TraceMinimap({ currentStep, onGoTo, collapsed, onToggle }: TraceMinimapProps) {
  return (
    <div className="hidden max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-sm lg:block">
      <button
        type="button"
        onClick={onToggle}
        className="mb-1 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-elevated)]"
        aria-expanded={!collapsed}
      >
        <span className="text-sm" aria-hidden>🗺️</span>
        {collapsed ? null : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Span Map
          </span>
        )}
        <span
          className={`ml-auto text-[10px] text-[var(--text-secondary)] ${collapsed ? "rotate-180" : ""}`}
        >
          {collapsed ? "›" : "‹"}
        </span>
      </button>

      <div className="space-y-0.5">
        {collapsed ? null : (
          <div className="px-2 pb-1 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              → Outbound — asking
            </span>
          </div>
        )}

        {CHECKPOINTS.map((cp, i) => {
          const envConf = ENV_CONFIG[cp.environment];
          const isActive = i === currentStep;
          const isPast = i < currentStep;
          const display = getDisplayInfo(cp.step);

          return (
            <span key={cp.step}>
              {i === TURNAROUND_STEP ? (
                collapsed ? (
                  <div className="my-1 flex justify-center">
                    <span className="text-[10px] text-amber-500 dark:text-amber-400">⟳</span>
                  </div>
                ) : (
                  <div className="my-2 flex items-center gap-2 px-2">
                    <div className="h-px flex-1 bg-amber-500/40" />
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      ⟳ TURNAROUND
                    </span>
                    <div className="h-px flex-1 bg-amber-500/40" />
                  </div>
                )
              ) : null}

              {i === TURNAROUND_STEP && !collapsed ? (
                <div className="px-2 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    ← Return — answering (7 steps)
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => { onGoTo(i); }}
                className={`flex w-full items-center gap-2 rounded-lg py-1.5 text-left text-xs transition-colors ${
                  collapsed ? "justify-center px-0" : "px-2"
                } ${
                  isActive
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] ring-1 ring-[var(--accent-indigo)]/60"
                    : isPast
                      ? "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    cp.direction === "return" ? "h-5 w-7 px-0.5" : "h-5 w-5"
                  } ${
                    isActive
                      ? cp.direction === "return"
                        ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-black"
                        : "bg-[var(--accent-indigo)] text-white"
                      : isPast
                        ? `${envConf.surface} ${envConf.text}`
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                  }`}
                >
                  {display.label}
                </span>
                {collapsed ? null : (
                  <span className="truncate">{cp.title.split(" — ")[0]}</span>
                )}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
