// Type definitions for the RequestTrace simulation component.

import type { BackpackEntry, Checkpoint } from "@/lib/request-trace";

export interface RequestTraceProps {
  readonly className?: string;
}

export interface CheckpointCardProps {
  readonly checkpoint: Checkpoint;
  readonly isActive: boolean;
  readonly isPast: boolean;
  readonly cumulativeBackpack: readonly BackpackEntry[];
}

export interface BackpackDisplayProps {
  readonly entries: readonly BackpackEntry[];
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

export interface JourneyProgressProps {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly direction: "outbound" | "return";
  readonly environment: "frontend" | "network" | "backend";
}
