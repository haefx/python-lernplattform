import type { MazeLevelDef } from "./types";

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function getStaticChar(level: MazeLevelDef, x: number, y: number): string {
  if (y < 0 || y >= level.rows.length) return "#";
  const row = level.rows[y] ?? "";
  if (x < 0 || x >= row.length) return "#";
  return row[x] ?? "#";
}

export function isChargerCell(level: MazeLevelDef, x: number, y: number): boolean {
  return getStaticChar(level, x, y) === "C";
}

export function isPoopCell(level: MazeLevelDef, x: number, y: number): boolean {
  return getStaticChar(level, x, y) === "K";
}

export function isFakeExitCell(level: MazeLevelDef, x: number, y: number): boolean {
  return getStaticChar(level, x, y) === "F";
}

export function parseBugSpawn(level: MazeLevelDef): { x: number; y: number } | null {
  for (let y = 0; y < level.rows.length; y += 1) {
    const row = level.rows[y] ?? "";
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "X") return { x, y };
    }
  }
  return null;
}

export function parsePoopPiles(level: MazeLevelDef): { x: number; y: number }[] {
  const piles: { x: number; y: number }[] = [];

  level.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "K") piles.push({ x, y });
    }
  });

  return piles;
}

export function isBrittleCell(
  level: MazeLevelDef,
  x: number,
  y: number,
  destroyedCells: Set<string>,
): boolean {
  return getStaticChar(level, x, y) === "B" && !destroyedCells.has(cellKey(x, y));
}
