// Props for the data-driven TraceProgress bar. Callers (RequestTrace,
// PipelineTrace) precompute the per-bar metadata so the component itself is a
// purely presentational renderer.

export interface TraceBarSeparator {
  readonly icon: string;
  readonly colorClass: string;
}

export interface TraceBar {
  readonly key: string;
  readonly ariaLabel: string;
  readonly title: string;
  readonly file: string | null;
  readonly href: string | null;
  readonly label: string;
  readonly phaseLabel: string;
  readonly textClass: string;
  readonly barActiveClass: string;
  readonly barPastClass: string;
  readonly separatorBefore: TraceBarSeparator | null;
  readonly noFileHint: string;
}

export interface TraceProgressProps {
  readonly bars: readonly TraceBar[];
  readonly currentStep: number;
  readonly onGoTo: (step: number) => void;
}
