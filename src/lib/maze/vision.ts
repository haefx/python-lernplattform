import { cellKey, getStaticChar, isBrittleCell } from "./grid";
import type { MazeLevelDef } from "./types";

function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

function isWallChar(
  level: MazeLevelDef,
  x: number,
  y: number,
  destroyedCells: Set<string>,
): boolean {
  if (getStaticChar(level, x, y) === "#") return true;
  return isBrittleCell(level, x, y, destroyedCells);
}

function isDoorClosed(
  level: MazeLevelDef,
  x: number,
  y: number,
  activatedLevers: Set<string>,
  bugCaught = false,
): boolean {
  const door = level.doors?.find((item) => item.x === x && item.y === y);
  if (!door) return false;
  if (level.id === 4 && door.id === "b1") return !bugCaught;
  const lever = level.levers?.find((item) => item.opens.includes(door.id));
  if (!lever) return true;
  return !activatedLevers.has(lever.id);
}

export interface MazeVisionContext {
  activatedLevers: Set<string>;
  destroyedCells: Set<string>;
  entranceClosed: boolean;
  bugCaught?: boolean;
  entrance: { x: number; y: number } | null;
  width: number;
  height: number;
}

/** Eingang + seitliche Wandfelder immer mitaufdecken (verhindert schwarze Ränder am Tor). */
export function ensureEntranceBandRevealed(
  revealed: Set<string>,
  entrance: { x: number; y: number } | null,
): Set<string> {
  if (!entrance) return revealed;

  const next = new Set(revealed);
  next.add(cellKey(entrance.x, entrance.y));
  next.add(cellKey(entrance.x - 1, entrance.y));
  next.add(cellKey(entrance.x + 1, entrance.y));
  return next;
}

/** Fog of War mit Sichtlinien – kein Durchblicken von Wänden. */
export function revealFromPosition(
  level: MazeLevelDef,
  revealed: Set<string>,
  originX: number,
  originY: number,
  context: MazeVisionContext,
  radius = 5,
): Set<string> {
  const next = new Set(revealed);
  next.add(cellKey(originX, originY));

  for (let ty = 0; ty < context.height; ty += 1) {
    for (let tx = 0; tx < context.width; tx += 1) {
      const dist = Math.max(Math.abs(tx - originX), Math.abs(ty - originY));
      if (dist > radius) continue;

      const line = bresenhamLine(originX, originY, tx, ty);
      for (let i = 1; i < line.length; i += 1) {
        const point = line[i];
        next.add(cellKey(point.x, point.y));

        if (isWallChar(level, point.x, point.y, context.destroyedCells)) break;
        if (
          isDoorClosed(
            level,
            point.x,
            point.y,
            context.activatedLevers,
            context.bugCaught ?? false,
          )
        ) {
          break;
        }
        if (
          context.entranceClosed &&
          context.entrance &&
          context.entrance.x === point.x &&
          context.entrance.y === point.y
        ) {
          break;
        }
      }
    }
  }

  return ensureEntranceBandRevealed(next, context.entrance);
}
