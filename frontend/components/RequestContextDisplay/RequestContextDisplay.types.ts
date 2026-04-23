// Props for the RequestContextDisplay emerald panel.
//
// Defaults match the original request-trace "Request Context" backpack. Callers
// (e.g. the pipeline trace) can override the title, emoji, and tooltip text to
// reuse the same visual panel for a different concept (Artifact Accumulator).

export interface ContextEntry {
  readonly key: string;
  readonly value: string;
}

export interface RequestContextDisplayProps {
  readonly entries: readonly ContextEntry[];
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly title?: string;
  readonly emoji?: string;
  readonly tooltipText?: string;
  readonly emptyText?: string;
}
