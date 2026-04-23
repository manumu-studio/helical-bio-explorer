// Barrel export for the pipeline-trace data model and shared config.

export { buildPipelineTraceBars, buildPipelineTraceMinimapItems } from "./build-bars";
export { PIPELINE_CHECKPOINTS } from "./checkpoints";
export type {
  AdrReference,
  ArtifactEntry,
  DataPreview,
  DesignDecision,
  PipelineCheckpoint,
  PipelineEnvironment,
  PipelinePhase,
} from "./types";
export {
  PHASE_LABELS,
  PHASE_SHORT_LABELS,
  PHASE_SPANS,
  PIPELINE_ENV_CONFIG,
  PIPELINE_GITHUB_REPO,
  PIPELINE_TOTAL_STEPS,
} from "./env-config";
export type { PipelineEnvStyle, PipelinePhaseSpan } from "./env-config";
