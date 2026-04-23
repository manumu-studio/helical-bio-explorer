// Emerald panel showing the cumulative Request Context backpack, paired with
// the per-step "Added to Request Context" button inside CheckpointCard.

"use client";

import { useState } from "react";

import type { RequestContextDisplayProps } from "./RequestContextDisplay.types";

export function RequestContextDisplay({ entries, isOpen, onToggle }: RequestContextDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span
          className="relative inline-flex items-baseline gap-1.5 text-sm font-semibold text-[var(--text-primary)]"
          onMouseEnter={() => { setShowTooltip(true); }}
          onMouseLeave={() => { setShowTooltip(false); }}
        >
          <span aria-hidden>🧭</span>
          <span>Request Context</span>
          <span className="text-[var(--text-secondary)]">({entries.length})</span>
          {showTooltip ? (
            <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-64 whitespace-normal rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-normal text-[var(--text-secondary)] shadow-xl">
              <span className="absolute bottom-full left-6 block border-4 border-transparent border-b-[var(--border)]" />
              Data accumulated as the request propagates through each span — grows from empty to the full payload needed for rendering.
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-xs text-[var(--text-secondary)]">
          {isOpen ? "collapse" : "expand"}
        </span>
      </button>

      {isOpen ? (
        <div className="border-t border-emerald-500/30 px-4 py-3">
          {entries.length === 0 ? (
            <p className="text-sm italic text-[var(--text-secondary)]">
              Empty — request not yet initiated
            </p>
          ) : (
            <dl className="space-y-1.5">
              {entries.map((entry, i) => (
                <div
                  key={`${entry.key}-${String(i)}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 text-sm"
                >
                  <dt className="shrink-0 font-mono text-emerald-700 dark:text-emerald-300">
                    {entry.key}:
                  </dt>
                  <dd className="min-w-0 break-all text-[var(--text-primary)]">
                    {entry.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ) : null}
    </div>
  );
}
