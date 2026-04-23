// Environment-keyed styling, phase metadata, and shared constants for the pipeline trace.

import type { PipelineEnvironment, PipelinePhase } from "./types";

export interface PipelineEnvStyle {
  readonly label: string;
  readonly text: string;
  readonly surface: string;
  readonly barActive: string;
  readonly barPast: string;
}

export const PIPELINE_ENV_CONFIG: Record<PipelineEnvironment, PipelineEnvStyle> = {
  colab: {
    label: "Colab",
    text: "text-purple-600 dark:text-purple-400",
    surface: "border-purple-500/30 bg-purple-500/10",
    barActive: "bg-purple-500 dark:bg-purple-400",
    barPast: "bg-purple-500/40 dark:bg-purple-400/40",
  },
  storage: {
    label: "S3 / Local",
    text: "text-teal-600 dark:text-teal-400",
    surface: "border-teal-500/30 bg-teal-500/10",
    barActive: "bg-teal-500 dark:bg-teal-400",
    barPast: "bg-teal-500/40 dark:bg-teal-400/40",
  },
  database: {
    label: "Database",
    text: "text-emerald-600 dark:text-emerald-400",
    surface: "border-emerald-500/30 bg-emerald-500/10",
    barActive: "bg-emerald-500 dark:bg-emerald-400",
    barPast: "bg-emerald-500/40 dark:bg-emerald-400/40",
  },
};

export const PHASE_LABELS: Record<PipelinePhase, string> = {
  "pbmc-reference": "Phase 1 — PBMC Reference",
  "covid-projection": "Phase 2 — COVID Projection",
  "genept-disagreement": "Phase 3 — GenePT Disagreement",
};

export const PHASE_SHORT_LABELS: Record<PipelinePhase, string> = {
  "pbmc-reference": "Phase 1 · Reference",
  "covid-projection": "Phase 2 · Projection",
  "genept-disagreement": "Phase 3 · Disagreement",
};

export interface PipelinePhaseSpan {
  readonly start: number;
  readonly end: number;
}

// Inclusive step ranges per phase — drives the phase badge and progress separators.
export const PHASE_SPANS: Record<PipelinePhase, PipelinePhaseSpan> = {
  "pbmc-reference": { start: 1, end: 6 },
  "covid-projection": { start: 7, end: 12 },
  "genept-disagreement": { start: 13, end: 15 },
};

export const PIPELINE_TOTAL_STEPS = 15;

export const PIPELINE_GITHUB_REPO =
  "https://github.com/manumu-studio/helical-bio-explorer/blob/main";
