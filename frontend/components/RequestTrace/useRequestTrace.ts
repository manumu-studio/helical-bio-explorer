// Hook that manages the request trace simulation state.

"use client";

import { useCallback, useMemo, useState } from "react";

import type { BackpackEntry } from "@/lib/request-trace";
import { CHECKPOINTS } from "@/lib/request-trace";

export function useRequestTrace() {
  const [currentStep, setCurrentStep] = useState(0);
  const [backpackOpen, setBackpackOpen] = useState(true);

  const checkpoint = CHECKPOINTS[currentStep] ?? null;
  const totalSteps = CHECKPOINTS.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const cumulativeBackpack = useMemo<readonly BackpackEntry[]>(() => {
    const entries: BackpackEntry[] = [];
    for (let i = 0; i <= currentStep; i++) {
      const cp = CHECKPOINTS[i];
      if (cp !== undefined) {
        for (const entry of cp.backpackAdds) {
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

  const toggleBackpack = useCallback(() => {
    setBackpackOpen((prev) => !prev);
  }, []);

  return {
    currentStep,
    checkpoint,
    totalSteps,
    isFirst,
    isLast,
    cumulativeBackpack,
    backpackOpen,
    next,
    prev,
    goTo,
    reset,
    toggleBackpack,
  };
}
