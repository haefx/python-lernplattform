"use client";

import { useEffect, useMemo, useRef } from "react";
import { cellKey } from "@/lib/maze/grid";

interface MazeFogLayerProps {
  gridWidth: number;
  gridHeight: number;
  revealed: Set<string>;
  robot: { x: number; y: number };
  entrance: { x: number; y: number } | null;
  entranceOpen?: boolean;
  extraVisible?: { x: number; y: number } | null;
}

/** Entdeckungs-Fade: 0 = frisch aufgedeckt, 1 = vollständig frei (vor Distanz-Nebel) */
const FOG_FADE_MS = 900;
/** Sichtradius in Feldern – entspricht revealFromPosition in vision.ts */
const VISION_RADIUS = 5;

function expandEntranceVisibility(
  revealed: Set<string>,
  entrance: { x: number; y: number } | null,
): Set<string> {
  if (!entrance) return revealed;

  const entranceKey = cellKey(entrance.x, entrance.y);
  if (!revealed.has(entranceKey)) return revealed;

  const expanded = new Set(revealed);
  expanded.add(entranceKey);
  expanded.add(cellKey(entrance.x - 1, entrance.y));
  expanded.add(cellKey(entrance.x + 1, entrance.y));
  return expanded;
}

function fadeProgress(revealedAt: number | undefined, now: number): number {
  if (revealedAt === undefined) return 0;
  if (revealedAt === 0) return 1;

  const linear = Math.min(1, (now - revealedAt) / FOG_FADE_MS);
  return 1 - (1 - linear) ** 2;
}

function distanceAlpha(
  gx: number,
  gy: number,
  robotX: number,
  robotY: number,
): number {
  const dist = Math.max(Math.abs(gx - robotX), Math.abs(gy - robotY));
  if (dist <= 0) return 0;
  if (dist >= VISION_RADIUS) return 1;

  const t = dist / VISION_RADIUS;
  return t * t * (3 - 2 * t);
}

function cellRect(
  gx: number,
  gy: number,
  cellW: number,
  cellH: number,
): { x0: number; y0: number; w: number; h: number } {
  const x0 = Math.floor(gx * cellW);
  const y0 = Math.floor(gy * cellH);
  const x1 = Math.floor((gx + 1) * cellW);
  const y1 = Math.floor((gy + 1) * cellH);
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
}

function punchFog(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  clarity: number,
) {
  if (clarity >= 1) {
    ctx.clearRect(x0, y0, w, h);
    return;
  }
  if (clarity <= 0) return;

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = `rgba(0, 0, 0, ${clarity})`;
  ctx.fillRect(x0, y0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

export default function MazeFogLayer({
  gridWidth,
  gridHeight,
  revealed,
  robot,
  entrance,
  entranceOpen = false,
  extraVisible = null,
}: MazeFogLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealTimesRef = useRef<Map<string, number>>(new Map());
  const gridKeyRef = useRef("");

  const expandedRevealed = useMemo(
    () => expandEntranceVisibility(revealed, entrance),
    [revealed, entrance],
  );

  const exploredKeys = useMemo(() => {
    const keys = new Set(expandedRevealed);
    keys.add(cellKey(robot.x, robot.y));
    if (extraVisible) {
      keys.add(cellKey(extraVisible.x, extraVisible.y));
    }
    if (entranceOpen && entrance) {
      keys.add(cellKey(entrance.x, entrance.y));
      keys.add(cellKey(entrance.x - 1, entrance.y));
      keys.add(cellKey(entrance.x + 1, entrance.y));
    }
    return keys;
  }, [expandedRevealed, entrance, entranceOpen, robot.x, robot.y, extraVisible]);

  useEffect(() => {
    const gridKey = `${gridWidth}x${gridHeight}`;
    const isNewGrid = gridKeyRef.current !== gridKey;
    if (isNewGrid) {
      gridKeyRef.current = gridKey;
      revealTimesRef.current.clear();
    }

    const now = performance.now();
    const isInitialSeed = revealTimesRef.current.size === 0;

    for (const key of exploredKeys) {
      if (revealTimesRef.current.has(key)) continue;
      const isRobotCell = key === cellKey(robot.x, robot.y);
      revealTimesRef.current.set(key, isInitialSeed || isRobotCell ? 0 : now);
    }

    revealTimesRef.current.set(cellKey(robot.x, robot.y), 0);
  }, [exploredKeys, gridWidth, gridHeight, robot.x, robot.y]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let rafId = 0;
    let canvasPw = 0;
    let canvasPh = 0;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const dpr = window.devicePixelRatio || 1;
      const pw = Math.round(rect.width * dpr);
      const ph = Math.round(rect.height * dpr);

      if (canvasPw !== pw || canvasPh !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        canvasPw = pw;
        canvasPh = ph;
      }

      return { pw, ph };
    };

    const cellFogAlpha = (gx: number, gy: number, now: number): number => {
      if (gx === robot.x && gy === robot.y) return 0;

      const key = cellKey(gx, gy);
      if (!exploredKeys.has(key)) return 1;

      const distAlpha = distanceAlpha(gx, gy, robot.x, robot.y);
      const fade = fadeProgress(revealTimesRef.current.get(key), now);
      return 1 - fade * (1 - distAlpha);
    };

    const draw = (now: number) => {
      const size = resizeCanvas();
      if (!size) return;

      const { pw, ph } = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cellW = pw / gridWidth;
      const cellH = ph / gridHeight;

      ctx.clearRect(0, 0, pw, ph);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, pw, ph);

      for (let gy = 0; gy < gridHeight; gy++) {
        for (let gx = 0; gx < gridWidth; gx++) {
          const alpha = cellFogAlpha(gx, gy, now);
          const { x0, y0, w, h } = cellRect(gx, gy, cellW, cellH);

          if (alpha <= 0) {
            ctx.clearRect(x0, y0, w, h);
            continue;
          }

          punchFog(ctx, x0, y0, w, h, 1 - alpha);
        }
      }
    };

    const frame = (now: number) => {
      draw(now);
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    const observer = new ResizeObserver(() => draw(performance.now()));
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [exploredKeys, gridWidth, gridHeight, robot.x, robot.y]);

  return (
    <div ref={containerRef} className="maze-fog-overlay" aria-hidden>
      <canvas ref={canvasRef} className="maze-fog-overlay__canvas" />
    </div>
  );
}
