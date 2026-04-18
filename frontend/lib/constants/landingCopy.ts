// All landing page copy as typed constants — edit copy here, not in components.

export const HERO_COPY = {
  eyebrow: "BIO-AI · SINGLE-CELL GENOMICS · 2026",
  headline: "See which cells went wrong. Faster than ever.",
  subline:
    "Embed patient cells with foundation models, map them against a healthy reference, and surface the differences that matter — at single-cell resolution.",
  ctaPrimary: "Launch Dashboard",
  ctaSecondary: "View on GitHub",
} as const;

export interface FeatureCard {
  readonly title: string;
  readonly body: string;
  readonly imageDark: string;
  readonly imageLight: string;
}

export const FEATURE_CARDS: readonly FeatureCard[] = [
  {
    title: "Reference Atlas",
    body: "2,638 healthy PBMC cells embedded by Geneformer, the same model Helical ships in their SDK. UMAP-projected, color-coded by 8 immune cell types.",
    imageDark: "/assets/reference-atlas-tab-black.webp",
    imageLight: "/assets/reference-atlas-tab-white.webp",
  },
  {
    title: "Disease Projection",
    body: "5,000 COVID-19 immune cells from Wilk et al. 2020 projected into the healthy reference. Distance-to-manifold quantifies abnormality, per cell.",
    imageDark: "/assets/projection-black.webp",
    imageLight: "/assets/projection-white.webp",
  },
  {
    title: "Distance Analysis",
    body: "Mean distance-to-healthy bucketed by cell type and disease severity. The heatmap surfaces which immune populations diverge most under viral load.",
    imageDark: "/assets/distance-black.webp",
    imageLight: "/assets/distance-white.webp",
  },
  {
    title: "Model Disagreement",
    body: "Geneformer and GenePT, two foundation models trained on different objectives, disagree about which cells are normal. Per-cell percentile-rank disagreement maps where they diverge.",
    imageDark: "/assets/disagreement-black.webp",
    imageLight: "/assets/disagreement-white.webp",
  },
] as const;

export interface PipelineStep {
  readonly number: number;
  readonly title: string;
  readonly body: string;
}

export const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    number: 1,
    title: "Load",
    body: "Healthy PBMC reference + COVID query data, both standard .h5ad AnnData files.",
  },
  {
    number: 2,
    title: "Embed",
    body: "Run Geneformer + GenePT via the Helical SDK. Get 512-dim and 1536-dim cell-level embeddings.",
  },
  {
    number: 3,
    title: "Compare",
    body: "Project disease into healthy. Measure distance, surface where the models disagree.",
  },
] as const;

export const TECH_BADGES = [
  "Helical AI",
  "Geneformer",
  "GenePT",
  "Next.js 15",
  "FastAPI",
  "Plotly",
  "Nivo",
] as const;

export const FOOTER_LINKS = {
  demo: { label: "Live Dashboard", href: "/dashboard" },
  api: {
    label: "API Explorer",
    href: "https://api.helical.manumustudio.com/docs",
  },
  github: {
    label: "GitHub",
    href: "https://github.com/manumu-studio/helical-bio-explorer",
  },
  helical: { label: "Helical SDK", href: "https://helical.bio" },
} as const;

export const CTA_FOOTER_COPY = {
  headline: "See it live",
  subline: "Explore the reference-mapping dashboard with real single-cell data.",
  cta: "Launch Dashboard",
} as const;
