import { cellKey, getStaticChar } from "./grid";
import type { MazeLevelDef, MazeRobot, MazeRuntimeState } from "./types";

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function isRobotAdjacentToBug(
  robot: MazeRobot,
  bug: { x: number; y: number },
): boolean {
  return manhattan(robot.x, robot.y, bug.x, bug.y) === 1;
}

function isBugDoorClosed(
  level: MazeLevelDef,
  x: number,
  y: number,
  bugCaught: boolean,
): boolean {
  const door = level.doors?.find((item) => item.x === x && item.y === y);
  return Boolean(level.id === 4 && door?.id === "b1" && !bugCaught);
}

function canBugWalkTo(
  level: MazeLevelDef,
  x: number,
  y: number,
  walls: Set<string>,
  robot: MazeRobot,
  bugCaught: boolean,
): boolean {
  if (x === robot.x && y === robot.y) return false;
  if (x < 0 || y < 0 || y >= level.rows.length) return false;
  const row = level.rows[y] ?? "";
  if (x >= row.length) return false;
  if (walls.has(cellKey(x, y))) return false;
  const ch = getStaticChar(level, x, y);
  if (ch === "F" || ch === "G" || ch === "E" || ch === "S") return true;
  if (ch === "H" || ch === "h" || ch === "C" || ch === "K" || ch === "X") return true;
  if (ch === "B" || ch === "T") return false;
  if (isBugDoorClosed(level, x, y, bugCaught)) return false;
  return ch === ".";
}

function getWallCells(level: MazeLevelDef): Set<string> {
  const walls = new Set<string>();
  for (let y = 0; y < level.rows.length; y += 1) {
    const row = level.rows[y] ?? "";
    for (let x = 0; x < row.length; x += 1) {
      if (getStaticChar(level, x, y) === "#") {
        walls.add(cellKey(x, y));
      }
    }
  }
  return walls;
}

export function fleeBugPosition(
  level: MazeLevelDef,
  robot: MazeRobot,
  bug: { x: number; y: number },
  bugCaught: boolean,
): { x: number; y: number } | null {
  const walls = getWallCells(level);
  const options: { x: number; y: number; dist: number }[] = [];

  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nx = bug.x + dx;
    const ny = bug.y + dy;
    if (!canBugWalkTo(level, nx, ny, walls, robot, bugCaught)) continue;
    options.push({
      x: nx,
      y: ny,
      dist: manhattan(nx, ny, robot.x, robot.y),
    });
  }

  if (options.length === 0) return null;

  const bestDist = Math.max(...options.map((item) => item.dist));
  const best = options.filter((item) => item.dist === bestDist);
  return best[Math.floor(Math.random() * best.length)] ?? null;
}

export function fleeBugBySteps(
  level: MazeLevelDef,
  robot: MazeRobot,
  bug: { x: number; y: number },
  steps: number,
  bugCaught: boolean,
): { x: number; y: number } {
  let position = { ...bug };

  for (let step = 0; step < steps; step += 1) {
    const next = fleeBugPosition(level, robot, position, bugCaught);
    if (!next) break;
    position = next;
  }

  return position;
}

export const LEVEL4_BUG_SLIPPERY_SPEECH =
  "Zu glitschig! Ich konnte ihn nicht festhalten – der Wurm rutscht weg!";

export function applyBugCatch(
  level: MazeLevelDef,
  state: MazeRuntimeState,
): MazeRuntimeState {
  if (state.bugCaught) {
    return { ...state, status: "running", message: "Der Bug ist schon gefangen!" };
  }

  if (!state.bugPosition) {
    return {
      ...state,
      status: "blocked",
      blockKind: "action",
      message: "Hier ist kein Bug – such ihn im Labyrinth!",
    };
  }

  if (!isRobotAdjacentToBug(state.robot, state.bugPosition)) {
    return {
      ...state,
      status: "blocked",
      blockKind: "action",
      message:
        "Fang ihn nur von direkt daneben – vor, hinter oder seitlich neben Pyto!",
    };
  }

  if (!state.bugSlipperyEscaped) {
    const fled = fleeBugBySteps(level, state.robot, state.bugPosition, 2, false);
    return {
      ...state,
      bugSlipperyEscaped: true,
      bugPosition: fled,
      status: "running",
      blockKind: null,
      message: LEVEL4_BUG_SLIPPERY_SPEECH,
    };
  }

  return {
    ...state,
    bugCaught: true,
    bugPosition: null,
    status: "running",
    blockKind: null,
    message: "Gotcha! Bug gefangen – das Tor öffnet sich!",
  };
}
