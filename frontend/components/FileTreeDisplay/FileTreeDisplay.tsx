// Collapsible project-tree view that highlights where the current checkpoint's file lives.

"use client";

import { useMemo, useState } from "react";

import type { TreeLine } from "@/lib/request-trace";
import { buildFileTree, CHECKPOINTS, renderTreeLines } from "@/lib/request-trace";

import type { FileTreeDisplayProps } from "./FileTreeDisplay.types";

export function FileTreeDisplay({ currentStep }: FileTreeDisplayProps) {
  const [isOpen, setIsOpen] = useState(true);

  const lines = useMemo<readonly TreeLine[]>(() => {
    const tree = buildFileTree(CHECKPOINTS, currentStep);
    return renderTreeLines(tree);
  }, [currentStep]);

  if (lines.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          Project tree
        </span>
        <button
          type="button"
          onClick={() => { setIsOpen((prev) => !prev); }}
          className="text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Collapse repo tree" : "Expand repo tree"}
        >
          {isOpen ? "collapse" : "expand"}
        </button>
      </div>

      {isOpen ? (
        <div className="px-3 py-2">
          {/*
            Tree rows must use a tight, fixed leading or the vertical tree
            connectors (│) from consecutive rows leave visible gaps and the
            lines look broken. `leading-[1.35]` is tight enough that `│` segments
            touch, while still leaving the text breathable.

            Each row's icon sits in a fixed-width cell (`w-5`) so file and
            folder names line up at every depth regardless of which emoji the
            browser renders.
          */}
          <pre className="font-mono text-sm leading-[1.35]">
            <span className="text-[var(--text-secondary)]">helical-bio-explorer/</span>
            {"\n"}
            {lines.map((line, i) => {
              const stepLabel = line.step !== null
                ? line.isCurrent
                  ? ` ★ step ${String(line.step)}`
                  : ` ← step ${String(line.step)}`
                : "";
              const icon = line.isFile ? "📄" : "📁";

              return (
                <span key={i}>
                  <span className="text-[var(--text-secondary)]">{line.prefix}</span>
                  <span
                    className="inline-block w-5 shrink-0 text-center align-middle"
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span
                    className={`align-middle ${
                      line.isCurrent
                        ? "font-bold text-emerald-600 dark:text-emerald-400"
                        : line.step !== null
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {line.name}
                  </span>
                  {stepLabel !== "" ? (
                    <span
                      className={`align-middle ${
                        line.isCurrent
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {stepLabel}
                    </span>
                  ) : null}
                  {"\n"}
                </span>
              );
            })}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
