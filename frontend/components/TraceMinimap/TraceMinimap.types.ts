// Props for the data-driven TraceMinimap sidebar. Callers precompute the
// per-step metadata and any section-header/divider rows so the minimap renders
// identically for both the request trace (Outbound/Return sections +
// turnaround) and the pipeline trace (Phase 1/2/3 headers).

export interface TraceMinimapDivider {
  readonly kind: "divider";
  readonly key: string;
  readonly longLabel: string;
  readonly shortIcon: string;
  readonly colorTextClass: string;
  readonly colorLineClass: string;
}

export interface TraceMinimapSectionHeader {
  readonly kind: "section";
  readonly key: string;
  readonly label: string;
}

export type TraceMinimapInsert = TraceMinimapDivider | TraceMinimapSectionHeader;

export interface TraceMinimapItem {
  readonly kind: "item";
  readonly key: string;
  readonly stepIndex: number;
  readonly label: string;
  readonly title: string;
  readonly wideBadge: boolean;
  readonly badgeActiveClass: string;
  readonly badgePastSurfaceClass: string;
  readonly badgePastTextClass: string;
  readonly insertsBefore: readonly TraceMinimapInsert[];
}

export interface TraceMinimapProps {
  readonly items: readonly TraceMinimapItem[];
  readonly currentStep: number;
  readonly onGoTo: (step: number) => void;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
  readonly headerLabel?: string;
  readonly initialSectionHeader?: string;
}
