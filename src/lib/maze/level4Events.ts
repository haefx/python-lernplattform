import { sleep } from "./animation";
import { parseLevelGrid } from "./engine";
import { cellKey, getStaticChar, isFakeExitCell } from "./grid";
import type { MazeLevelDef, MazeRuntimeState } from "./types";

export const LEVEL4_SPEECH_MS = 2800;
export const LEVEL4_BUG_FLEE_RADIUS = 3;

export const LEVEL4_FAKE_EXIT_LINES = [
  "Oh, ein Ausgang!",
  "Moment … 404 – Ausgang nicht gefunden!",
  "Das war wohl nur ein Placeholder …",
] as const;

export const LEVEL4_BUG_SPOT_SPEECH =
  "Ein Bug! Der huscht gleich weg – stell dich drauf und ruf fangen()!";

export const LEVEL4_BUG_FLEE_SPEECH = "Huch, der Bug ist abgehauen!";

export interface Level4EventFlags {
  fakeExit: boolean;
  bugSpotted: boolean;
  /** Flucht-Spruch nur einmal pro Level. */
  bugFleeAnnounced: boolean;
}

export function createLevel4EventFlags(): Level4EventFlags {
  return { fakeExit: false, bugSpotted: false, bugFleeAnnounced: false };
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
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
  bugCaught: boolean,
): boolean {
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

function fleeBugPosition(
  level: MazeLevelDef,
  robot: { x: number; y: number },
  bug: { x: number; y: number },
  bugCaught: boolean,
): { x: number; y: number } | null {
  const { walls } = parseLevelGrid(level);
  const options: { x: number; y: number; dist: number }[] = [];

  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nx = bug.x + dx;
    const ny = bug.y + dy;
    if (!canBugWalkTo(level, nx, ny, walls, bugCaught)) continue;
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

export interface Level4InteractionResult {
  statePatch: Partial<MazeRuntimeState> | null;
}

export async function handleLevel4Interactions(
  level: MazeLevelDef,
  prev: MazeRuntimeState,
  next: MazeRuntimeState,
  flags: Level4EventFlags,
  onSpeech: (text: string | null) => void,
): Promise<Level4InteractionResult> {
  if (level.id !== 4) return { statePatch: null };

  let bugPosition = next.bugPosition;
  let statePatch: Partial<MazeRuntimeState> | null = null;

  if (
    !flags.fakeExit &&
    isFakeExitCell(level, next.robot.x, next.robot.y) &&
    (prev.robot.x !== next.robot.x || prev.robot.y !== next.robot.y)
  ) {
    flags.fakeExit = true;
    for (const line of LEVEL4_FAKE_EXIT_LINES) {
      onSpeech(line);
      await sleep(LEVEL4_SPEECH_MS);
    }
    onSpeech(null);
  }

  if (bugPosition && !next.bugCaught) {
    const bugKey = cellKey(bugPosition.x, bugPosition.y);
    const bugRevealed = next.revealed.has(bugKey);
    const wasBugRevealed = prev.revealed.has(bugKey);

    if (!flags.bugSpotted && bugRevealed && !wasBugRevealed) {
      flags.bugSpotted = true;
      onSpeech(LEVEL4_BUG_SPOT_SPEECH);
      await sleep(LEVEL4_SPEECH_MS);
      onSpeech(null);
    }

    const dist = manhattan(next.robot.x, next.robot.y, bugPosition.x, bugPosition.y);
    if (dist > 0 && dist <= LEVEL4_BUG_FLEE_RADIUS) {
      const fled = fleeBugPosition(level, next.robot, bugPosition, next.bugCaught);
      if (fled && (fled.x !== bugPosition.x || fled.y !== bugPosition.y)) {
        bugPosition = fled;
        statePatch = { bugPosition: fled };
        if (flags.bugSpotted && !flags.bugFleeAnnounced) {
          flags.bugFleeAnnounced = true;
          onSpeech(LEVEL4_BUG_FLEE_SPEECH);
          await sleep(LEVEL4_SPEECH_MS);
          onSpeech(null);
        }
      }
    }
  }

  if (statePatch?.bugPosition) {
    return { statePatch: { bugPosition: statePatch.bugPosition } };
  }

  return { statePatch: null };
}
