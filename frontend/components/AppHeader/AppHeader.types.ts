// Props for the shared app header used across landing and dashboard pages.

import type { ReactNode } from "react";

export interface AppHeaderProps {
  /** Extra elements rendered on the right side (provenance chip, etc.) */
  readonly rightSlot?: ReactNode;
  /** Additional CSS classes for the outer header element */
  readonly className?: string;
  /** Whether the header sits over transparent content (landing hero). Disables border. */
  readonly transparent?: boolean;
  /** Callback when the About panel should open */
  readonly onAboutOpen?: () => void;
  /** Event handlers to wire to all interactive elements (helix animation on landing) */
  readonly interactionHandlers?: {
    readonly onMouseEnter: () => void;
    readonly onMouseLeave: () => void;
  };
}
