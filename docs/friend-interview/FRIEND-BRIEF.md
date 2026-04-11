# Helical AI — explained through your thesis

> **Audience:** Manu's closest friend, a PhD neuroscientist. This is the background document Manu sent him before their phone call on 2026-04-10, so the conversation could start from shared ground rather than from scratch.

Hi,

I need to borrow your brain for a bit. I have a technical conversation lined up with a European startup called **Helical AI**, and after spending a few hours looking at what they actually do, I realized something: they are essentially doing **the same thing you did in your thesis**, just in a different domain. Almost literally.

## The parallel

Think back to your PhD. Thousands of brain images — healthy versus diseased. You analyzed each one from multiple angles, extracted feature vectors, fed them into statistical models (linear regressions included), and at the end you produced a signal: *"this is what distinguishes a diseased brain from a healthy one."*

Helical does the same fundamental thing, but applied to **individual cells** and **DNA/RNA sequences**, and using **modern AI (foundation models)** instead of classical regressions.

| Your thesis | Helical |
|---|---|
| Input: brain images (healthy / diseased) | Input: single-cell data (RNA-seq), DNA, RNA |
| You analyzed each image from multiple angles | The models "look" at each cell from thousands of dimensions at once |
| You extracted vectors / features by hand | They extract **embeddings** (high-dimensional vectors) automatically |
| Linear regressions plus other statistical models | **Bio foundation models** pre-trained on enormous corpora (think GPT, but for biology) |
| Classified: healthy vs. diseased | Classify: cell type, drug response, disease trajectory, effect of a mutation |

The concept is not new — it is the same thing you were doing. What is new is that instead of designing features by hand and running them through a regression, you now have large pre-trained models that already "know" what a cell looks like because they have seen millions of them.

## What "bio foundation models" actually are

Think of GPT, but instead of having read the whole internet, it has read:

- Millions of single-cell gene-expression profiles (models like **Geneformer**, **scGPT**, **UCE**, **Tahoe-x1**).
- Billions of base pairs of DNA (models like **HyenaDNA**, **Evo2**, **Caduceus**).
- Messenger RNA sequences (Helical's own in-house model, **Helix-mRNA**).

When you feed one of these models a new cell, it returns a vector that encodes what that cell is — its type, state, lineage, condition. Conceptually the same as the vector you used to extract from each brain, except you no longer have to design the features by hand.

## What Helical actually sells

Here is the important nuance: **Helical does not invent most of the models themselves.** Nearly all of them come out of academic labs (Stanford, CZ Biohub, Arc Institute, and similar). What the company does is:

1. **Package the models into an open-source Python library** (`pip install helical`) with a unified API. Before this, you had to go model by model, fight with broken dependencies, and reverse-engineer undocumented research scripts. A real headache.

2. **Build the application layer on top**: tooling, interfaces, tutorials. So that a biologist — not necessarily an ML engineer — can actually use these models without having to wrestle with CUDA.

It is as if someone took every published academic model for medical image analysis and wrapped them all behind a single `pip install` with decent documentation. That layer — the "make it usable" part — is what they sell to pharmaceutical companies.

## Why it matters (and why pharma pays for it)

- A new drug costs, on average, **around €2 billion and 10+ years** from discovery to market.
- Most of that cost is the **wet lab**: slow, physical experiments.
- **In-silico drug discovery** is the idea of moving as much of that work as possible onto the computer. Millions of virtual experiments in days instead of years.
- Bio foundation models are the key ingredient: they let you predict what is going to happen *before* you commit it to a Petri dish.
- Helical already says they work with leading global pharmaceutical companies. They are European, founder-led, early-stage but with real paying customers.

## Why I'm writing to you

I want to build a small portfolio project (about 10 days, which is the runway I have) that uses their library and shows something **biologically interesting**, not a hollow demo. The exact phrasing I got from the recruiter was:

> *"Show real passion for biotech and AI. Candidates have been rejected from these conversations for failing to transmit it."*

That is where I need you. You have done exactly this kind of analysis — healthy versus diseased, vectors, extracting patterns from raw data — just in brain images instead of cells.

What I need from you is three things:

1. **Scientific direction.** What biological question would actually be worth attacking with this? Which public datasets are "classics" or have a story behind them?
2. **Real passion, in your words.** I don't want to parrot marketing lines — I want to be able to explain, in plain language, why this field genuinely excites someone who has spent years inside it.
3. **Course correction.** If any of my ideas are naive or scientifically off, tell me before I put them out there.

I'm sending a second file, `FRIEND-QUESTIONS.md`, with the concrete questions. Answer however is easiest for you — voice notes, bullet points, links, whatever. Whatever you give me tomorrow I'll turn into a decision.

Thanks. I owe you at least a couple of beers.
