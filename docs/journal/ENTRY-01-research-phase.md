# Entry 01 — Research phase

**Date:** 2026-04-10
**Type:** Research / planning
**Branch:** `main` (repo initialized empty)

## Summary

Kicked off the project with a research-first phase. No code yet — the goal was to understand what Helical actually does, what the realistic compute envelope is, and which project concept is finishable in ~10 days before the 2026-04-20 interview deadline.

## What was done

1. Explored the upstream Helical SDK repo cloned at `../helical/` to build a mental model of its structure (15+ models under `helical/models/`, Hydra-based config, PyTorch 2.7).
2. Drafted and ran a **deep research prompt** against Claude.ai covering: the company (business model, funding, team, customers), the industry (in-silico drug discovery, competitive landscape, state-of-the-art), existing patterns (CELLxGENE Explorer, Vitessce, sc-umap-viz), model-by-model feasibility on CPU, and dataset candidates. Full output preserved in [`docs/research/CLAUDE-RESEARCH-OUTPUT.md`](../research/CLAUDE-RESEARCH-OUTPUT.md).
3. Had a **phone call with a PhD neuroscientist friend** (transcript at [`docs/friend-interview/CALL-TRANSCRIPT-2026-04-10.md`](../friend-interview/CALL-TRANSCRIPT-2026-04-10.md)) to get domain grounding and a real passion narrative. The friend's thesis (thousands of brain images, vector extraction, linear regressions for sick-vs-healthy classification) turned out to be a near-perfect conceptual analogy for what Helical automates — this became the backbone of the interview story.
4. Crystallized the passion narrative in [`docs/friend-interview/PASSION-NARRATIVE.md`](../friend-interview/PASSION-NARRATIVE.md).
5. Made decisions (in [`docs/research/DECISIONS.md`](../research/DECISIONS.md)):
   - **Primary model:** Geneformer V1 (10M params, CPU-supported)
   - **Baseline model:** GenePT (zero trainable params, instant on CPU)
   - **Primary dataset:** PBMC 3k (2,638 cells, universally recognized)
   - **Compute strategy:** precompute everything in Colab, serve static `.parquet` from FastAPI
   - **Project target:** start **HelixDiff** (2 models, 1 dataset), upgrade to **CellVista** (3 models, 2 datasets) only if ahead of schedule by day 5
6. Scaffolded the repo documentation structure matching the LSA `System v2.0` pattern plus a new `docs/chat-sessions/` folder with an auto-managed session tracking protocol embedded in `CLAUDE.md`.

## Key decisions + rationale

- **Why research before coding?** The interview deadline is tight (before 2026-04-20). Picking the wrong project or wrong model would waste days. Two hours of research prevented multiple days of dead ends — the research surfaced that several models in Helical's catalog (Evo 2, Caduceus, Helix-mRNA) literally cannot run without CUDA, which would have killed a naive build.

- **Why not pick the ambitious project (CellVista)?** The research itself rated it 7/10 feasibility and flagged scGPT CPU inference as "feasible but pushing limits." The interview is introductory, not a take-home grade. A polished smaller thing (HelixDiff) beats a half-built impressive thing. CellVista stays as an *upgrade target*, not the baseline.

- **Why the brain angle in the narrative but the PBMC dataset in the project?** Narrative and implementation don't need to match. The brain story is about *why I care* (friend's PhD experience); the PBMC dataset is about *what ships in 10 days* (smallest, most canonical, CPU-feasible). In the interview, the project becomes a conscious choice: *"I picked PBMC 3k because I wanted to focus engineering time on the SDK integration, not on wrestling a niche dataset."*

- **Why preserve the full research verbatim?** Research outputs decay fast — if I lose the source document, I lose the context for every subsequent decision. Preserving it as `CLAUDE-RESEARCH-OUTPUT.md` (plus the original prompt in `RESEARCH-BRIEF.md`) means decisions stay auditable and reproducible.

- **Why add `docs/chat-sessions/` as a new pattern?** The LSA `session-prompts/` folder works for archiving session prompts, but not for auto-resuming work across fresh Claude Code sessions. The new pattern bakes "on first message, read the last session file + continuation prompt" directly into `CLAUDE.md` so no context is ever lost between sessions during this time-pressured sprint.

## Files touched

- `README.md` (created)
- `.gitignore` (created)
- `CLAUDE.md` (created — includes the new session protocol)
- `docs/research/DECISIONS.md` (created)
- `docs/research/CLAUDE-RESEARCH-OUTPUT.md` (created — full research preserved)
- `docs/research/RESEARCH-BRIEF.md` (created — original prompt preserved)
- `docs/friend-interview/FRIEND-BRIEF-ES.md` (created)
- `docs/friend-interview/FRIEND-QUESTIONS-ES.md` (created)
- `docs/friend-interview/CALL-TRANSCRIPT-2026-04-10.md` (created)
- `docs/friend-interview/PASSION-NARRATIVE.md` (created)
- `docs/chat-sessions/README.md` (created)
- `docs/chat-sessions/001-2026-04-10-research-phase.md` (created)
- `docs/journal/ENTRY-01-research-phase.md` (this file)
- `CONTINUATION_PROMPT_NEXT_SESSION.md` (created — gitignored)

## Next step

User needs to:
1. Confirm direction: **Option C (HelixDiff-first, upgrade to CellVista if ahead)** or override.
2. Listen to the PixelScientia podcast with Rick Schneider.
3. Send the follow-up text to the PhD friend.
4. When ready to start coding, type **"start phase 1"** and we'll scaffold the FastAPI + Next.js monorepo.
