import { sleep } from "./animation";
import { cellKey, isFakeExitCell } from "./grid";
import { fleeBugPosition } from "./level4Bug";
import type { MazeLevelDef, MazeRuntimeState } from "./types";

export const LEVEL4_SPEECH_MS = 2800;
export const LEVEL4_BUG_FLEE_RADIUS = 3;

export const LEVEL4_FAKE_EXIT_LINES = [
  "Oh, ein Ausgang!",
  "Moment … 404 – Ausgang nicht gefunden!",
  "Das war wohl nur ein Placeholder …",
] as const;

export const LEVEL4_BUG_SPOT_SPEECH =
  "Ein Bug! Der huscht gleich weg – stell dich neben ihn und ruf fangen()!";

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

export interface Level4InteractionResult {
  statePatch: Partial<MazeRuntimeState> | null;
}

export async function handleLevel4Interactions(
  level: MazeLevelDef,
  prev: MazeRuntimeState,
  next: MazeRuntimeState,
  flags: Level4EventFlags,
  onSpeech: (text: string | null) => void,
  bugMovedThisRun: { value: boolean },
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

    if (!bugMovedThisRun.value) {
      const dist = manhattan(next.robot.x, next.robot.y, bugPosition.x, bugPosition.y);
      if (dist > 0 && dist <= LEVEL4_BUG_FLEE_RADIUS) {
        const fled = fleeBugPosition(level, next.robot, bugPosition, next.bugCaught);
        if (fled && (fled.x !== bugPosition.x || fled.y !== bugPosition.y)) {
          bugMovedThisRun.value = true;
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
  }

  if (statePatch?.bugPosition) {
    return { statePatch: { bugPosition: statePatch.bugPosition } };
  }

  return { statePatch: null };
}
