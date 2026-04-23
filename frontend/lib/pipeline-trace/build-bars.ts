// Builds the presentational arrays (TraceBar[], TraceMinimapItem[]) for the
// pipeline-trace progress bar and minimap. Inserts phase-boundary separators
// (Phase 1 → 2 at step 7, Phase 2 → 3 at step 13) and per-phase section
// headers in the minimap.

import type { TraceBar } from "@/components/TraceProgress";
import type {
  TraceMinimapInsert,
  TraceMinimapItem,
} from "@/components/TraceMinimap";

import { PIPELINE_CHECKPOINTS } from "./checkpoints";
import {
  PHASE_LABELS,
  PHASE_SHORT_LABELS,
  PHASE_SPANS,
  PIPELINE_ENV_CONFIG,
  PIPELINE_GITHUB_REPO,
} from "./env-config";
import type { PipelinePhase } from "./types";

const PHASE_SEPARATOR_COLOR: Record<PipelinePhase, string> = {
  "pbmc-reference": "text-purple-500 dark:text-purple-400",
  "covid-projection": "text-teal-500 dark:text-teal-400",
  "genept-disagreement": "text-amber-500 dark:text-amber-400",
};

function isPhaseStart(phase: PipelinePhase, step: number): boolean {
  return PHASE_SPANS[phase].start === step;
}

function shortTitle(title: string): string {
  return title.split(" — ")[0] ?? title;
}

export function buildPipelineTraceBars(): readonly TraceBar[] {
  return PIPELINE_CHECKPOINTS.map((cp, i) => {
    const envConfig = PIPELINE_ENV_CONFIG[cp.environment];
    const href = cp.file !== null ? `${PIPELINE_GITHUB_REPO}/${cp.file}` : null;
    const isPhaseBoundary = i > 0 && isPhaseStart(cp.phase, cp.step);

    return {
      key: String(cp.step),
      ariaLabel: `Step ${String(cp.step)}: ${cp.title}`,
      title: shortTitle(cp.title),
      file: cp.file,
      href,
      label: String(cp.step),
      phaseLabel: PHASE_SHORT_LABELS[cp.phase],
      textClass: envConfig.text,
      barActiveClass: envConfig.barActive,
      barPastClass: envConfig.barPast,
      separatorBefore: isPhaseBoundary
        ? { icon: "│", colorClass: PHASE_SEPARATOR_COLOR[cp.phase] }
        : null,
      noFileHint: "Computed in-memory — no file",
    } satisfies TraceBar;
  });
}

export function buildPipelineTraceMinimapItems(): readonly TraceMinimapItem[] {
  return PIPELINE_CHECKPOINTS.map((cp, i) => {
    const envConfig = PIPELINE_ENV_CONFIG[cp.environment];
    const insertsBefore: TraceMinimapInsert[] = [];

    if (i > 0 && isPhaseStart(cp.phase, cp.step)) {
      insertsBefore.push({
        kind: "divider",
        key: `${cp.phase}-divider`,
        longLabel: PHASE_LABELS[cp.phase].toUpperCase(),
        shortIcon: "│",
        colorTextClass: PHASE_SEPARATOR_COLOR[cp.phase],
        colorLineClass:
          cp.phase === "covid-projection"
            ? "bg-teal-500/40"
            : "bg-amber-500/40",
      });
      insertsBefore.push({
        kind: "section",
        key: `${cp.phase}-section`,
        label: PHASE_SHORT_LABELS[cp.phase],
      });
    }

    return {
      kind: "item" as const,
      key: String(cp.step),
      stepIndex: i,
      label: String(cp.step),
      title: shortTitle(cp.title),
      wideBadge: false,
      badgeActiveClass: "bg-[var(--accent-indigo)] text-white",
      badgePastSurfaceClass: envConfig.surface,
      badgePastTextClass: envConfig.text,
      insertsBefore,
    } satisfies TraceMinimapItem;
  });
}
