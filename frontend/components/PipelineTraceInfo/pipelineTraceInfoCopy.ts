// Editable copy for the Pipeline Trace info modal.

export const PIPELINE_TRACE_COPY = {
  what_it_is:
    "This visualization traces the offline precompute pipeline — 15 spans across 3 phases, from raw public single-cell datasets to the versioned parquet artifacts the runtime API serves. Each span maps to real notebook or backend code.",
  how_to_navigate:
    "Use the progress bar or Prev / Next buttons to step through the pipeline. Phase 1 (spans 1–6) builds the healthy PBMC reference; Phase 2 (spans 7–12) projects COVID cells into it; Phase 3 (spans 13–15) computes cross-model disagreement with GenePT.",
  span_interactions:
    "Click any inactive span to jump to it. Click the active span to open the corresponding file on GitHub. Hover over a span for a tooltip showing its title and click action. The Artifact Accumulator sidebar grows as artifacts are produced.",
  what_to_look_for:
    "Each span shows the environment it runs in (Colab, S3/Local, Database), the Python snippet, data-shape previews where meaningful, the ADRs that justified the choice, and a design-decision callout when there is a non-obvious trade-off.",
} as const;

export const PIPELINE_TRACE_HIGHLIGHTS = [
  {
    label: "Precompute over live inference",
    detail:
      "Colab T4 GPU runs ~30 seconds of model inference so the deployed t3.micro never does — static parquet is instant to serve.",
  },
  {
    label: "Transform, not re-fit",
    detail:
      "Phase 2 projects COVID cells into the PBMC UMAP space with transform(), keeping the reference manifold fixed.",
  },
  {
    label: "Percentile-rank disagreement",
    detail:
      "Geneformer and GenePT live on different scales — percentile ranks normalize both before comparison.",
  },
  {
    label: "Provenance by SHA",
    detail:
      "Every parquet artifact has a precompute_runs row with model version, parameters, and the git SHA that produced it.",
  },
] as const;
