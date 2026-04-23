// Props for the RequestContextDisplay emerald panel.

import type { BackpackEntry } from "@/lib/request-trace";

export interface RequestContextDisplayProps {
  readonly entries: readonly BackpackEntry[];
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}
