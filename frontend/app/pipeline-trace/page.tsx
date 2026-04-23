// Page: interactive pipeline trace visualization — 15 spans from raw dataset to parquet artifacts.

import type { Metadata } from "next";

import { AppHeader } from "@/components/AppHeader";
import { PipelineTrace } from "@/components/PipelineTrace";

export const metadata: Metadata = {
  title: "Pipeline Trace — 15 Spans",
  description:
    "Interactive trace through the offline Colab precompute pipeline: 3 phases, 15 spans, from raw dataset to versioned parquet artifacts.",
};

export default function PipelineTracePage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />
      <main className="flex min-h-0 flex-1 flex-col">
        <PipelineTrace className="flex-1" />
      </main>
    </div>
  );
}
