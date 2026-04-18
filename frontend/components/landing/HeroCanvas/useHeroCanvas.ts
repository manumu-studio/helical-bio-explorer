// Canvas animation: 5k dots in 8 cell-type clusters with lerp-based helix hover transition.

"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef } from "react";

import type { ClusterConfig, Dot } from "./HeroCanvas.types";
import { getHelixState } from "./useHelixHover";

/* ── Cluster definitions ─────────────────────────────────────────────── */

const CELL_TYPE_COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#84cc16",
] as const;

const CLUSTERS: readonly ClusterConfig[] = [
  { cx: 0.20, cy: 0.30, count: 750, color: CELL_TYPE_COLORS[0], label: "CD4 T" },
  { cx: 0.35, cy: 0.25, count: 700, color: CELL_TYPE_COLORS[1], label: "CD8 T" },
  { cx: 0.55, cy: 0.20, count: 650, color: CELL_TYPE_COLORS[2], label: "B" },
  { cx: 0.70, cy: 0.35, count: 600, color: CELL_TYPE_COLORS[3], label: "NK" },
  { cx: 0.25, cy: 0.60, count: 700, color: CELL_TYPE_COLORS[4], label: "Monocyte" },
  { cx: 0.50, cy: 0.55, count: 650, color: CELL_TYPE_COLORS[5], label: "DC" },
  { cx: 0.75, cy: 0.60, count: 500, color: CELL_TYPE_COLORS[6], label: "Platelet" },
  { cx: 0.65, cy: 0.75, count: 450, color: CELL_TYPE_COLORS[7], label: "Megakaryocyte" },
];

const TOTAL_DOTS = CLUSTERS.reduce((sum, c) => sum + c.count, 0); // 5,000

/* ── Lerp constants ──────────────────────────────────────────────────── */

const LERP_FAST = 0.08;
const LERP_SLOW = 0.015;
const SNAP_THRESHOLD = 0.5;
const OVERSHOOT_FACTOR = 1.05;
const OVERSHOOT_SETTLE_RATIO = 0.2;
const ROTATION_SPEED = 0.0008; // radians per ms — rotisserie spin
const HELIX_TURNS = 8;
const IDLE_DRIFT_PX = 12; // livelier idle movement
const IDLE_SPEED_MIN = 0.0008; // faster base speed for idle drift
const IDLE_SPEED_RANGE = 0.0008;
const DEPTH_RADIUS_SCALE = 0.6; // how much depth affects dot size
const DEPTH_OPACITY_SCALE = 0.5; // how much depth affects opacity

/* ── Helpers ─────────────────────────────────────────────────────────── */

function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Compute a point on one backbone strand at parameter t with phase offset.
 * Returns x, y and depth (-1..1) for 3D rotisserie cuing.
 */
function helixPosition(
  t: number,
  strand: 1 | -1,
  width: number,
  height: number,
  phaseOffset: number,
): { x: number; y: number; depth: number } {
  const angle = t * HELIX_TURNS * 2 * Math.PI + phaseOffset;
  const amplitude = Math.min(width, height) * 0.05;
  const diag = Math.atan2(height, width);
  const perpX = -Math.sin(diag);
  const perpY = Math.cos(diag);

  return {
    x: t * width + perpX * Math.sin(angle) * amplitude * strand,
    y: t * height + perpY * Math.sin(angle) * amplitude * strand,
    depth: Math.cos(angle) * strand,
  };
}

function createDots(width: number, height: number): Dot[] {
  const dots: Dot[] = [];
  let globalIndex = 0;

  for (const cluster of CLUSTERS) {
    const spread = Math.min(width, height) * 0.08;
    for (let i = 0; i < cluster.count; i++) {
      const clusterX = cluster.cx * width + gaussianRandom() * spread;
      const clusterY = cluster.cy * height + gaussianRandom() * spread;

      const t = globalIndex / TOTAL_DOTS;
      const strand: 1 | -1 = globalIndex % 2 === 0 ? 1 : -1;
      const { x: helixX, y: helixY } = helixPosition(t, strand, width, height, 0);

      dots.push({
        clusterX,
        clusterY,
        helixX,
        helixY,
        currentX: clusterX,
        currentY: clusterY,
        color: cluster.color,
        radius: 1.0 + Math.random() * 1.2,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speed: IDLE_SPEED_MIN + Math.random() * IDLE_SPEED_RANGE,
      });

      globalIndex++;
    }
  }
  return dots;
}

/** Recompute helix targets with rotation phase offset + return depth per dot. */
function updateHelixTargets(dots: Dot[], width: number, height: number, phaseOffset: number): Float32Array {
  const depths = new Float32Array(dots.length);
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    if (!dot) continue;
    const t = i / dots.length;
    const strand: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const { x, y, depth } = helixPosition(t, strand, width, height, phaseOffset);
    dot.helixX = x;
    dot.helixY = y;
    depths[i] = depth;
  }
  return depths;
}

/* ── Hook ────────────────────────────────────────────────────────────── */

export function useHeroCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  reducedMotion: boolean,
) {
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number>(0);
  const rotationPhaseRef = useRef(0);
  const settledCountRef = useRef(0);
  const depthsRef = useRef<Float32Array>(new Float32Array(0));
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
      ctx.clearRect(0, 0, width, height);

      const state = getHelixState();
      const isHelix = state === "hovering" || state === "locked";
      const lerpFactor = isHelix ? LERP_FAST : LERP_SLOW;
      const baseOpacity = isDark ? 0.6 : 0.75;
      const centerX = width * 0.5;
      const centerY = height * 0.45;
      const fadeRadius = Math.min(width, height) * 0.35;

      // Rotation: only when 90%+ dots settled on helix
      if (isHelix && settledCountRef.current > dotsRef.current.length * 0.9) {
        rotationPhaseRef.current += ROTATION_SPEED * 16;
        depthsRef.current = updateHelixTargets(dotsRef.current, width, height, rotationPhaseRef.current);
      } else if (!isHelix) {
        rotationPhaseRef.current *= 0.95;
        if (Math.abs(rotationPhaseRef.current) > 0.001) {
          depthsRef.current = updateHelixTargets(dotsRef.current, width, height, rotationPhaseRef.current);
        }
      }

      let settledCount = 0;

      for (let i = 0; i < dotsRef.current.length; i++) {
        const dot = dotsRef.current[i];
        if (!dot) continue;

        let targetX: number;
        let targetY: number;

        if (isHelix) {
          targetX = dot.helixX;
          targetY = dot.helixY;

          // Overshoot: push target 5% past helix pos during initial travel
          const dx = targetX - dot.currentX;
          const dy = targetY - dot.currentY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const initialDist = Math.sqrt(
            (dot.helixX - dot.clusterX) ** 2 + (dot.helixY - dot.clusterY) ** 2,
          );
          if (initialDist > 0 && dist > initialDist * OVERSHOOT_SETTLE_RATIO) {
            const overshootDist = dist * (OVERSHOOT_FACTOR - 1);
            const norm = dist > 0 ? 1 / dist : 0;
            targetX += dx * norm * overshootDist;
            targetY += dy * norm * overshootDist;
          }
        } else {
          // Idle: cluster position with sinusoidal drift
          const offsetX = Math.sin(time * dot.speed + dot.phaseX) * IDLE_DRIFT_PX;
          const offsetY = Math.cos(time * dot.speed + dot.phaseY) * IDLE_DRIFT_PX;
          targetX = dot.clusterX + offsetX;
          targetY = dot.clusterY + offsetY;
        }

        // Lerp toward target
        dot.currentX += (targetX - dot.currentX) * lerpFactor;
        dot.currentY += (targetY - dot.currentY) * lerpFactor;

        // Snap threshold
        const snapDx = targetX - dot.currentX;
        const snapDy = targetY - dot.currentY;
        if (snapDx * snapDx + snapDy * snapDy < SNAP_THRESHOLD * SNAP_THRESHOLD) {
          dot.currentX = targetX;
          dot.currentY = targetY;
          if (isHelix) settledCount++;
        }

        // Radial falloff: cells near center text area fade out (idle only)
        let drawRadius = dot.radius;
        const distToCenter = Math.sqrt(
          (dot.currentX - centerX) ** 2 + (dot.currentY - centerY) ** 2,
        );
        const radialFade = isHelix
          ? 1
          : Math.min(1, 0.25 + 0.75 * (distToCenter / fadeRadius));
        let drawOpacity = baseOpacity * radialFade;

        if (isHelix && depthsRef.current.length > 0) {
          const depth = depthsRef.current[i] ?? 0;
          const depthNorm = (depth + 1) * 0.5;
          drawRadius = dot.radius * (1 - DEPTH_RADIUS_SCALE + DEPTH_RADIUS_SCALE * depthNorm);
          drawOpacity = baseOpacity * (1 - DEPTH_OPACITY_SCALE + DEPTH_OPACITY_SCALE * depthNorm);
        }

        ctx.beginPath();
        ctx.arc(dot.currentX, dot.currentY, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = drawOpacity;
        ctx.fill();
      }

      settledCountRef.current = settledCount;
      ctx.globalAlpha = 1;
    },
    [isDark],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      dotsRef.current = createDots(rect.width, rect.height);
      depthsRef.current = new Float32Array(dotsRef.current.length);
      rotationPhaseRef.current = 0;
      settledCountRef.current = 0;
    };

    resize();
    window.addEventListener("resize", resize);

    if (reducedMotion) {
      const drawStatic = () => {
        const rect = canvas.getBoundingClientRect();
        const state = getHelixState();
        const isHelix = state === "hovering" || state === "locked";

        for (const dot of dotsRef.current) {
          if (isHelix) {
            dot.currentX = dot.helixX;
            dot.currentY = dot.helixY;
          } else {
            dot.currentX = dot.clusterX;
            dot.currentY = dot.clusterY;
          }
        }

        draw(ctx, rect.width, rect.height, 0);
      };

      drawStatic();
      const interval = setInterval(drawStatic, 100);

      return () => {
        window.removeEventListener("resize", resize);
        clearInterval(interval);
      };
    }

    const loop = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, time);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, draw, reducedMotion]);
}
