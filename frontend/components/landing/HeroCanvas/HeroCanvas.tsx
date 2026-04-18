// Procedural 8-cluster cell-dot canvas: stylized UMAP visualization for the landing hero.

"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { HeroCanvasProps } from "./HeroCanvas.types";
import { useHeroCanvas } from "./useHeroCanvas";
import { resetHelixState } from "./useHelixHover";

export function HeroCanvas({ className }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Reset locked state when landing page mounts (user navigated back)
  useEffect(() => {
    resetHelixState();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => {
      mq.removeEventListener("change", handler);
    };
  }, []);

  useHeroCanvas(canvasRef, reducedMotion);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        "dark:mix-blend-lighten mix-blend-multiply",
        className,
      )}
      aria-hidden
    />
  );
}
