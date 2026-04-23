# Entry 15 — 2026-04-23 — Disagreement Tab Dual-Axis Refactor

**Type:** Enhancement (interview feedback)
**Branch:** `feature/visualization-overhaul`
**Version:** 0.14.0

## Summary

Refactored the Disagreement tab chart based on direct feedback from Benoit Putzeys (Head of Software, Helical AI) during the R2 interview on 2026-04-21. Instead of plotting a combined disagreement score, the chart now plots Geneformer's distance on the X-axis and GenePT's distance on the Y-axis — exactly what Benoit expected to see.

## Context

During the R2 demo, Benoit reviewed the Disagreement tab and said he "would have expected to see a binary label — one is the distance of GPT and one is the distance of Geneformer." The original chart averaged both distances into a single X-axis value and plotted a disagreement score on Y. That obscured what each model was actually saying about each cell.

## What changed

### DisagreementView chart axes
- **X-axis:** Changed from `(distance_geneformer + distance_genept) / 2` → `distance_geneformer`
- **Y-axis:** Changed from `disagreement` → `distance_genept`
- **Title:** "Cross-model disagreement vs mean distance" → "Geneformer vs GenePT — distance to healthy"
- **Axis labels:** Updated to "Geneformer distance to healthy" / "GenePT distance to healthy"
- **Hover template:** Updated labels from "GF" / "GenePT" to "GF dist" / "GenePT dist"

### Explanatory text
Updated the "What you're seeing" panel to explain the diagonal interpretation:
- Cells on the diagonal = models agree
- Cells off the diagonal = models disagree — worth investigating

## Files modified
- `frontend/components/DisagreementView/DisagreementView.tsx` — chart data mapping, axis labels, title, hover template, explanation text

## Key decisions

| Decision | Rationale |
|---|---|
| Plot raw distances instead of derived score | Benoit explicitly expected to see each model's distance separately — this is the standard approach in model comparison |
| Keep disagreement data in hover | The disagreement value is still useful context when inspecting individual cells, even though it's no longer an axis |
| Diagonal framing in explanation | "On/off the diagonal" is intuitive shorthand for agreement/disagreement without needing a separate metric |

## Interview connection

This change directly addresses Benoit's R2 feedback (session 043). For the upcoming code walkthrough, this tab now demonstrates:
1. Each model produces its own distance-to-healthy metric independently
2. The scatter reveals where models agree (diagonal) vs disagree (off-diagonal)
3. Cell types cluster differently per model — a genuine analytical insight
