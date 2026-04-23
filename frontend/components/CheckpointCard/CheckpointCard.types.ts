// Props for the CheckpointCard — the detail panel for the currently active span.

import type { Checkpoint } from "@/lib/request-trace";

export interface CheckpointCardProps {
  readonly checkpoint: Checkpoint;
  readonly currentStep: number;
  readonly onRevealContext: () => void;
}
