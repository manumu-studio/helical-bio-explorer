// Canvas placeholder: paper + plot area, grid, axes/ticks, 10k blinking cell-colored dots (matches UMAP chrome).

"use client";

import { useEffect, useRef } from "react";

import { CELL_TYPE_COLORS } from "@/lib/constants/cellTypeColors";
import { useDashboardPlotlyColors } from "@/lib/plotly/useDashboardPlotlyColors";

const POINT_COUNT = 10_000;

/** Seeded PRNG for stable point layout across mounts. */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PointBundle = {
  nx: Float32Array;
  ny: Float32Array;
  phase: Float32Array;
  colors: string[];
};

function createPointBundle(n: number): PointBundle {
  const rnd = mulberry32(0x5ca1ab1e);
  const nx = new Float32Array(n);
  const ny = new Float32Array(n);
  const phase = new Float32Array(n);
  const colors: string[] = new Array(n);
  const palette = [
    ...Object.values(CELL_TYPE_COLORS),
    "#94a3b8",
    "#cbd5e1",
    "#64748b",
  ];
  for (let i = 0; i < n; i += 1) {
    nx[i] = rnd();
    ny[i] = rnd();
    phase[i] = rnd() * Math.PI * 2;
    colors[i] = palette[Math.floor(rnd() * palette.length)] ?? "#94a3b8";
  }
  return { nx, ny, phase, colors };
}

const BUNDLE = createPointBundle(POINT_COUNT);

/** X-axis tick values (typical UMAP 1 range). */
const X_TICKS = [-5, 0, 5, 10, 15] as const;
/** Y-axis tick values (typical UMAP 2 range). */
const Y_TICKS = [0, 2, 4, 6, 8, 10, 12, 14] as const;

export function UmapLoadingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const plotColors = useDashboardPlotlyColors();
  const paletteRef = useRef(plotColors);
  paletteRef.current = plotColors;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas === null || container === null) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return;
    }

    const drawFrame = (timeMs: number) => {
      const t = timeMs * 0.001;
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const palette = paletteRef.current;
      const { paper, plot, grid, text, textMuted, zeroline } = palette;

      const mL = Math.max(52, w * 0.12);
      const mB = Math.max(48, h * 0.16);
      const mT = Math.max(28, h * 0.08);
      const mR = Math.max(20, w * 0.05);
      const plotLeft = mL;
      const plotTop = mT;
      const plotW = w - mL - mR;
      const plotH = h - mT - mB;
      const plotRight = plotLeft + plotW;
      const plotBottom = plotTop + plotH;

      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = plot;
      ctx.fillRect(plotLeft, plotTop, plotW, plotH);

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.9;
      const gridX = 10;
      const gridY = 8;
      for (let i = 0; i <= gridX; i += 1) {
        const x = plotLeft + (i / gridX) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, plotTop);
        ctx.lineTo(x, plotBottom);
        ctx.stroke();
      }
      for (let j = 0; j <= gridY; j += 1) {
        const y = plotTop + (j / gridY) * plotH;
        ctx.beginPath();
        ctx.moveTo(plotLeft, y);
        ctx.lineTo(plotRight, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const { nx, ny, phase, colors } = BUNDLE;
      const blinkSpeed = 2.4;
      for (let i = 0; i < POINT_COUNT; i += 1) {
        const nxi = nx[i];
        const nyi = ny[i];
        const ph = phase[i];
        if (nxi === undefined || nyi === undefined || ph === undefined) {
          continue;
        }
        const blink = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * blinkSpeed + ph));
        ctx.globalAlpha = blink;
        ctx.fillStyle = colors[i] ?? "#94a3b8";
        const px = plotLeft + nxi * plotW;
        const py = plotTop + nyi * plotH;
        ctx.fillRect(px, py, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = zeroline;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, plotBottom);
      ctx.lineTo(plotRight, plotBottom);
      ctx.moveTo(plotLeft, plotTop);
      ctx.lineTo(plotLeft, plotBottom);
      ctx.stroke();

      ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = text;
      ctx.strokeStyle = grid;

      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const xMin = -5;
      const xMax = 15;
      for (const xv of X_TICKS) {
        const frac = (xv - xMin) / (xMax - xMin);
        const x = plotLeft + frac * plotW;
        ctx.beginPath();
        ctx.moveTo(x, plotBottom);
        ctx.lineTo(x, plotBottom + 5);
        ctx.stroke();
        ctx.fillText(String(xv), x, plotBottom + 8);
      }

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const yMin = 0;
      const yMax = 14;
      for (const yv of Y_TICKS) {
        const frac = (yv - yMin) / (yMax - yMin);
        const y = plotBottom - frac * plotH;
        ctx.beginPath();
        ctx.moveTo(plotLeft - 5, y);
        ctx.lineTo(plotLeft, y);
        ctx.stroke();
        ctx.fillText(String(yv), plotLeft - 8, y);
      }

      ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = textMuted;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("UMAP 1", plotLeft + plotW / 2, plotBottom + 26);

      ctx.save();
      ctx.translate(plotLeft - 36, plotTop + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("UMAP 2", 0, 0);
      ctx.restore();

      rafRef.current = window.requestAnimationFrame(drawFrame);
    };

    rafRef.current = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none relative h-full min-h-[200px] w-full min-w-0 flex-1">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  );
}
