// Props for the PipelineCheckpointCard — the detail panel for the currently
// active pipeline span.

import type { PipelineCheckpoint } from "@/lib/pipeline-trace";

export interface PipelineCheckpointCardProps {
  readonly checkpoint: PipelineCheckpoint;
  readonly onRevealArtifacts: () => void;
}
