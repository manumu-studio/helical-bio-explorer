// Props for the TraceMinimap sidebar.

export interface TraceMinimapProps {
  readonly currentStep: number;
  readonly onGoTo: (step: number) => void;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}
