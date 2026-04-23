// Builds the presentational arrays (TraceBar[], TraceMinimapItem[]) for the
// request-trace progress bar and minimap. Keeps those reusable components
// decoupled from request-trace data while preserving the original turnaround
// marker + outbound/return phase labeling.

import type { TraceBar } from "@/components/TraceProgress";
import type {
  TraceMinimapInsert,
  TraceMinimapItem,
} from "@/components/TraceMinimap";

import { CHECKPOINTS } from "./checkpoints";
import {
  ENV_CONFIG,
  GITHUB_REPO,
  TURNAROUND_STEP,
  getDisplayInfo,
} from "./env-config";

export function buildRequestTraceBars(): readonly TraceBar[] {
  return CHECKPOINTS.map((cp, i) => {
    const envConfig = ENV_CONFIG[cp.environment];
    const display = getDisplayInfo(cp.step);
    const href = cp.file !== null ? `${GITHUB_REPO}/${cp.file}` : null;
    const shortTitle = cp.title.split(" — ")[0] ?? cp.title;

    return {
      key: String(cp.step),
      ariaLabel: `Step ${display.label}: ${cp.title}`,
      title: shortTitle,
      file: cp.file,
      href,
      label: display.label,
      phaseLabel: display.phaseLabel,
      textClass: envConfig.text,
      barActiveClass: envConfig.barActive,
      barPastClass: envConfig.barPast,
      separatorBefore:
        i === TURNAROUND_STEP
          ? { icon: "⟳", colorClass: "text-amber-500 dark:text-amber-400" }
          : null,
      noFileHint: "Network transit — no file",
    } satisfies TraceBar;
  });
}

export function buildRequestTraceMinimapItems(): readonly TraceMinimapItem[] {
  return CHECKPOINTS.map((cp, i) => {
    const envConfig = ENV_CONFIG[cp.environment];
    const display = getDisplayInfo(cp.step);
    const isReturn = cp.direction === "return";
    const shortTitle = cp.title.split(" — ")[0] ?? cp.title;

    const insertsBefore: TraceMinimapInsert[] = [];
    if (i === TURNAROUND_STEP) {
      insertsBefore.push({
        kind: "divider",
        key: "turnaround-divider",
        longLabel: "⟳ TURNAROUND",
        shortIcon: "⟳",
        colorTextClass: "text-amber-600 dark:text-amber-400",
        colorLineClass: "bg-amber-500/40",
      });
      insertsBefore.push({
        kind: "section",
        key: "return-section",
        label: "← Return — answering (7 steps)",
      });
    }

    return {
      kind: "item" as const,
      key: String(cp.step),
      stepIndex: i,
      label: display.label,
      title: shortTitle,
      wideBadge: isReturn,
      badgeActiveClass: isReturn
        ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-black"
        : "bg-[var(--accent-indigo)] text-white",
      badgePastSurfaceClass: envConfig.surface,
      badgePastTextClass: envConfig.text,
      insertsBefore,
    } satisfies TraceMinimapItem;
  });
}
