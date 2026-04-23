// Props for the TraceProgress progress bar.

export interface TraceProgressProps {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly onGoTo: (step: number) => void;
}
