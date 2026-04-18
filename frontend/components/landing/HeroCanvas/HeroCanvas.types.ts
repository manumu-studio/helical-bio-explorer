// Types for the procedural cell-cluster canvas animation with helix hover effect.

export interface ClusterConfig {
  readonly cx: number;
  readonly cy: number;
  readonly count: number;
  readonly color: string;
  readonly label: string;
}

export interface Dot {
  /** Precomputed cluster target (Gaussian scatter position) */
  clusterX: number;
  clusterY: number;
  /** Precomputed helix target (parametric double-helix position) */
  helixX: number;
  helixY: number;
  /** Current animated position (lerped each frame) */
  currentX: number;
  currentY: number;
  /** Visual */
  color: string;
  radius: number;
  /** Idle cluster drift */
  phaseX: number;
  phaseY: number;
  speed: number;
}

export type HelixState = "idle" | "hovering" | "locked";

export interface HeroCanvasProps {
  readonly className?: string;
}
