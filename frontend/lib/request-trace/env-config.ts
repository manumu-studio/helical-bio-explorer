// Shared config, constants, and display helpers for the request-trace component tree.

import type { Direction, Environment } from "./checkpoints";

export interface EnvStyle {
  readonly label: string;
  readonly text: string;
  readonly surface: string;
  readonly barActive: string;
  readonly barPast: string;
}

// Environment-keyed color palette — tuned to work on both light and dark themes.
export const ENV_CONFIG: Record<Environment, EnvStyle> = {
  frontend: {
    label: "Frontend",
    text: "text-blue-600 dark:text-blue-400",
    surface: "border-blue-500/30 bg-blue-500/10",
    barActive: "bg-blue-500 dark:bg-blue-400",
    barPast: "bg-blue-500/40 dark:bg-blue-400/40",
  },
  network: {
    label: "Network",
    text: "text-amber-600 dark:text-amber-400",
    surface: "border-amber-500/30 bg-amber-500/10",
    barActive: "bg-amber-500 dark:bg-amber-400",
    barPast: "bg-amber-500/40 dark:bg-amber-400/40",
  },
  backend: {
    label: "Backend",
    text: "text-orange-600 dark:text-orange-400",
    surface: "border-orange-500/30 bg-orange-500/10",
    barActive: "bg-orange-500 dark:bg-orange-400",
    barPast: "bg-orange-500/40 dark:bg-orange-400/40",
  },
  database: {
    label: "Database",
    text: "text-emerald-600 dark:text-emerald-400",
    surface: "border-emerald-500/30 bg-emerald-500/10",
    barActive: "bg-emerald-500 dark:bg-emerald-400",
    barPast: "bg-emerald-500/40 dark:bg-emerald-400/40",
  },
};

export const DIRECTION_LABEL: Record<Direction, string> = {
  outbound: "Outbound — the click is asking",
  return: "Return — the answer comes back",
};

export const GATE_ICON: Record<string, string> = {
  data: "📦",
  validator: "🎫",
};

// Step 16 is where the outbound phase ends and the return phase begins.
export const TURNAROUND_STEP = 16;

export const OUTBOUND_COUNT = 16;
export const RETURN_COUNT = 7;

export const GITHUB_REPO = "https://github.com/manumu-studio/helical-bio-explorer/blob/main";

export interface DisplayInfo {
  readonly label: string;
  readonly phaseLabel: string;
  readonly phaseStep: number;
  readonly phaseTotal: number;
}

// Turns a raw step index into the UI label + phase metadata. Outbound steps
// display as "N", return steps as "RN" so the user can tell which half of the
// trip they are watching.
export function getDisplayInfo(step: number): DisplayInfo {
  if (step <= OUTBOUND_COUNT) {
    return { label: String(step), phaseLabel: "Outbound", phaseStep: step, phaseTotal: OUTBOUND_COUNT };
  }
  const returnStep = step - OUTBOUND_COUNT;
  return {
    label: `R${String(returnStep)}`,
    phaseLabel: "Return",
    phaseStep: returnStep,
    phaseTotal: RETURN_COUNT,
  };
}
