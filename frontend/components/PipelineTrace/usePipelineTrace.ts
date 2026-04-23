// Hook that manages the pipeline-trace navigation state — step index, cumulative
// artifact accumulator, phase derivation, and the open/close state for the sidebar.

"use client";

import { useCallback, useMemo, useState } from "react";

import type { ArtifactEntry, PipelinePhase } from "@/lib/pipeline-trace";
import { PIPELINE_CHECKPOINTS } from "@/lib/pipeline-trace";

export function usePipelineTrace() {
  const [currentStep, setCurrentStep] = useState(0);
  const [artifactsOpen, setArtifactsOpen] = useState(true);

  const checkpoint = PIPELINE_CHECKPOINTS[currentStep] ?? null;
  const totalSteps = PIPELINE_CHECKPOINTS.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const currentPhase: PipelinePhase | null = checkpoint !== null ? checkpoint.phase : null;

  const cumulativeArtifacts = useMemo<readonly ArtifactEntry[]>(() => {
    const entries: ArtifactEntry[] = [];
    for (let i = 0; i <= currentStep; i++) {
      const cp = PIPELINE_CHECKPOINTS[i];
      if (cp !== undefined) {
        for (const entry of cp.artifactAdds) {
          entries.push(entry);
        }
      }
    }
    return entries;
  }, [currentStep]);

  const next = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goTo = useCallback(
    (step: number) => {
      setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
    },
    [totalSteps],
  );

  const reset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const toggleArtifacts = useCallback(() => {
    setArtifactsOpen((prev) => !prev);
  }, []);

  return {
    currentStep,
    checkpoint,
    totalSteps,
    isFirst,
    isLast,
    currentPhase,
    cumulativeArtifacts,
    artifactsOpen,
    next,
    prev,
    goTo,
    reset,
    toggleArtifacts,
  };
}
