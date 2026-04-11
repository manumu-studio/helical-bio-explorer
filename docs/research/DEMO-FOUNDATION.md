# Demo Foundation — The Reference Mapping Paradigm

**Created:** 2026-04-10 (end of Session 002)
**Status:** 🟢 Locked as the scientific backbone of the demo.
**Supersedes:** the "model comparison" framing from Session 001. Model comparison is preserved, but subordinated to the reference-mapping question.

---

## The core question the demo answers

> *"If I have cell data from sick people, how do I quickly understand what's different about their cells so I can help them?"*

This is the one-line pitch. Everything in the demo exists to answer this question.

---

## Where the methodology came from

Manu asked his PhD neuroscientist friend (a researcher who did ADHD brain-imaging work):

> *"If you had a tool that analyzes individual data and finds patterns precisely, what comes next?"*

The friend's answer (paraphrased from audio transcript, originally in Spanish):

> *"It depends on the researcher, but in principle you need a **template** to compare against. You need a structure — for the brain, the pixels — of what would be considered **normal**, with the different colors and intensities that identify the process. Then you just need data from different individuals. And you have to **define categories** — for example, in ADHD we differentiated the impulsive subtype, the inattentive subtype, and the mixed subtype. The patients had already been **clinically classified** via prior tests. Then you cross the data: patients without ADHD criteria + patients with ADHD subtypes A, B, C — and you look for **structural differences, pixel by pixel**."*

This is exactly the methodology the demo implements — translated from brain MRI voxels to single-cell RNA-seq embeddings.

---

## The scientific mapping: friend's brain imaging → our single-cell demo

| Friend's ADHD brain imaging workflow | Our Geneformer + PBMC demo |
|---|---|
| MRI **template** of a normal brain | **Reference embedding manifold** built from Geneformer on **PBMC 3k** (healthy immune cells) |
| Pre-classified patients (ADHD subtypes A/B/C, controls) | Pre-labeled sick patients from the **second PBMC dataset** (healthy vs diseased, ideally with subtypes) |
| Pixel-level comparison against the template | **Embedding-level comparison** against the healthy reference: cosine distance to nearest healthy centroid, nearest-neighbor overlap, shifts in cluster membership |
| Finding structural differences | Finding which cell types drift away from normal, which cells are most "abnormal," which subpopulations appear only in disease |
| Clinical test classification → groups (A/B/C) | Disease subtypes (e.g., COVID mild / severe, or lupus active / remission) → projected as overlays in the same embedding space |

**The key insight:** Geneformer gives you a learned representation of "what healthy immune cells look like." Once that manifold exists, **projecting sick cells into it** and measuring distance is the single-cell equivalent of comparing pixel intensity against a normal brain template.

This is a real scientific pattern — it's called **reference mapping** or **query-to-reference projection**. It's what tools like Symphony, scArches, scHPL, and the CELLxGENE Census use foundation model embeddings for. It is one of the flagship use cases Helical's Virtual Lab is designed to enable.

---

## Why this framing is stronger than "model comparison"

Previous narrative (Session 001): *"Look how Geneformer and GenePT organize the same data differently."*
New narrative (Session 002): *"Build a healthy reference from Geneformer, project sick cells into it, find which are most different — and show how GenePT disagrees about what counts as 'normal.'"*

The new framing is stronger because:

1. **It answers a real scientific question** — not just a technical curiosity. "What's wrong with these cells?" is what a biologist actually asks.
2. **It matches how foundation models are actually used in the wild.** Reference mapping is the dominant paradigm for scRNA-seq with foundation models.
3. **It demonstrates product understanding.** Helical's Virtual Lab is literally meant to make this workflow fast. The demo becomes a miniature version of their product.
4. **It subsumes the model comparison.** GenePT vs Geneformer now becomes: "different foundation models disagree about what 'normal' looks like" — which is a sharper, more interesting story than "two UMAPs side by side."
5. **It creates a clear before/after.** Healthy reference (before disease) → sick projection (after disease) → divergence score. Narrative arc built in.
6. **It maps directly to the passion narrative.** The friend's brain imaging anecdote and the technical demo become the *same story* in two modalities.

---

## The 4-step demo pipeline (scientific spine)

Every dashboard feature must serve one of these 4 steps. Anything that doesn't is cut.

### Step 1 — Build the healthy reference (the "template")
- Run **Geneformer V1** on **PBMC 3k** → 256-dim embeddings per cell
- Compute UMAP → this is the "healthy immune cell atlas"
- Per cell type, compute **centroids** in embedding space (these are the "normal anchors")
- **Repeat with GenePT** → a second, independent reference manifold
- **Dashboard view:** the healthy UMAP, colored by cell type, toggleable between Geneformer and GenePT

### Step 2 — Project sick cells into the reference
- Run Geneformer on the **disease PBMC dataset** (same tokenizer, same model)
- Plot diseased cells **in the same UMAP coordinates** as the healthy reference (either by co-embedding or projection)
- Colour diseased cells by their disease subtype (if available)
- **Dashboard view:** UMAP with healthy (grey) + diseased (colored by subtype) overlaid

### Step 3 — Measure the difference (the "cross-comparison")
- For each diseased cell: cosine distance to its nearest healthy centroid of the same cell type
- Rank cells by abnormality score → top N "most different" cells
- Per cell type, histogram of abnormality scores for healthy vs each disease subtype
- **Dashboard view:** divergence heatmap (cell type × disease subtype), plus a "most abnormal cells" table

### Step 4 — Show that model choice matters (the "contrast")
- Repeat steps 1–3 with GenePT
- Show the **same cells** with different abnormality rankings in the two models
- Quantify agreement: correlation of abnormality ranks between models, Jaccard of top-N abnormal cells
- **Dashboard view:** a "model disagreement" panel — which cells does Geneformer think are abnormal that GenePT does not, and vice versa?

---

## What stays locked from Session 001/002

All Session 002 D1–D4 decisions hold. This foundation is **a refinement of the narrative**, not an override of the stack:

- ✅ FastAPI + Next.js 15 + TypeScript + Tailwind + Docker Compose + GitHub Actions
- ✅ Geneformer V1 (`gf-6L-10M-i2048`) + GenePT
- ✅ PBMC 3k via `scanpy.datasets.pbmc3k()` (healthy reference)
- ✅ Precompute in Google Colab → export `.parquet` → FastAPI serves static files
- ✅ No DB, no Prisma, no EC2/S3 goal
- ✅ Strict Helical-only dashboard (no scanpy differential expression)
- ✅ Read-only git, architect/builder/owner separation

## What this refines

- **Narrative:** from "model comparison" → "healthy reference + disease projection + model disagreement"
- **Dataset criteria for the second PBMC dataset:** *subtypes are now highly valuable*. Previously we wanted "healthy vs diseased." Now we also want subtype labels if possible (e.g., COVID mild/severe, lupus active/remission) because the friend's methodology was built on subtypes. Candidates to re-rank next session with this in mind.
- **Dashboard scope:** 4 views, one per pipeline step. Not "5 features" — 4 tightly-coupled steps that tell one story.

## Passion narrative integration

The friend's brain-imaging story and the technical demo are now **the same methodology in two modalities**. When the interviewer asks "why this project?" the answer becomes:

> *"My friend analyzed ADHD brains by comparing each patient's brain pixels against a template of what a normal brain looks like, crossed with clinical subtype labels. I wanted to know if foundation models let you do the same thing for single cells — build a reference of what healthy immune cells look like in embedding space, then project sick cells into it and see which ones drift. Turns out Helical's SDK makes this a ~100-line Python file. That felt like magic."*

This is tight, truthful, and shows comprehension of both the science and the product.

---

## Implications for the phased roadmap (to be detailed in next session)

- **Packet 01 (Scaffold):** unchanged scope, but must pick a disease dataset WITH SUBTYPES if possible
- **Packet 02 (Precompute):** now must produce BOTH a reference manifold AND projected disease cells, with per-cell distance-to-centroid scores, exported as parquet
- **Packet 03 (Backend):** endpoints now serve (a) reference, (b) projection, (c) divergence scores, (d) model disagreement — 4 endpoints matching the 4 steps
- **Packet 04 (Frontend):** 4 dashboard views, one per step, in order — a guided tour, not a freeform explorer
- **Packet 05 (Polish/deploy):** README tells the healthy-reference-+-disease-projection story; demo walkthrough follows the 4-step pipeline

Next session: draft Packet 01 with this framing embedded.
