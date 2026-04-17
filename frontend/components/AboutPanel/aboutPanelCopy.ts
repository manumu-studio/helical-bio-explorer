// Editable copy for the dashboard “About this demo” modal (ADR-001 framing).

export const ABOUT_COPY = {
  reference_mapping:
    "Reference mapping embeds a healthy cell atlas once, then projects new samples into that space so distance to the manifold measures how far each cell sits from “normal.” Tools like Symphony, scArches, and CELLxGENE Census use this pattern. Here we run Geneformer and GenePT and highlight where the two models disagree about abnormality.",
  what_this_demo_shows:
    "Reference tab: healthy PBMC manifold. Projection tab: COVID cells mapped into that space. Distance tab: per-cell drift toward disease. Disagreement tab: cross-model sanity check on those distances.",
  how_it_was_built:
    "FastAPI + Next.js 15, Helical SDK precompute in Colab, parquet on S3 with local fallback.",
} as const;

export const ABOUT_LINKS = [
  { label: "GitHub repo", href: "https://github.com/manumurillo0430/helical-bio-explorer" },
  { label: "API Explorer (Swagger)", href: "https://api.helical.manumustudio.com/docs" },
  { label: "Helical SDK on helical.bio", href: "https://helical.bio" },
] as const;
