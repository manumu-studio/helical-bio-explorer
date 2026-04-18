// Module-level shared hover state for helix animation. Read by canvas rAF loop, written by button handlers.

"use client";

import { useCallback, useState } from "react";

import type { HelixState } from "./HeroCanvas.types";

let helixState: HelixState = "idle";
let hoverCount = 0;

/** Read by the canvas draw loop every frame — no React state, no re-renders. */
export function getHelixState(): HelixState {
  return helixState;
}

/** Reset helix state to idle. Called on component unmount to clean up locked state. */
export function resetHelixState(): void {
  helixState = "idle";
  hoverCount = 0;
}

export interface HelixHoverHandlers {
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
  readonly onClick: () => void;
  readonly isLoading: boolean;
}

/**
 * Shared hook wired to every landing CTA button.
 * Multiple buttons can be hovered concurrently — hoverCount tracks that.
 */
export function useHelixHover(): HelixHoverHandlers {
  const [isLoading, setIsLoading] = useState(false);

  const onMouseEnter = useCallback(() => {
    hoverCount++;
    if (helixState !== "locked") {
      helixState = "hovering";
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    hoverCount = Math.max(0, hoverCount - 1);
    if (hoverCount === 0 && helixState !== "locked") {
      helixState = "idle";
    }
  }, []);

  const onClick = useCallback(() => {
    helixState = "locked";
    setIsLoading(true);
  }, []);

  return { onMouseEnter, onMouseLeave, onClick, isLoading };
}
