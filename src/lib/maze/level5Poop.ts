import { sleep } from "./animation";
import { cellKey, parsePoopPiles } from "./grid";
import type { MazeLevelDef, MazeRuntimeState } from "./types";

export const POOP_SMELL_RADIUS = 4;
export const POOP_SPEECH_MS = 2800;

export const POOP_SMELL_SPEECH = "Was riecht hier so??";

export const POOP_REVEAL_LINES = [
  "Was ist das??",
  "Igitt, hat hier jemand etwa hinge**** … das ist ja eklig!",
  "Ich dachte, wir schreiben sauberen Code!",
] as const;

export const POOP_STEP_SPEECH =
  "Schön vorsichtig … ich will da nicht rein treten!";

export interface PoopEventFlags {
  smell: boolean;
  revealed: boolean;
  stepped: boolean;
}

export function createPoopEventFlags(): PoopEventFlags {
  return { smell: false, revealed: false, stepped: false };
}

function manhattanDistance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export async function handlePoopInteractions(
  level: MazeLevelDef,
  prev: MazeRuntimeState,
  next: MazeRuntimeState,
  flags: PoopEventFlags,
  onSpeech: (text: string | null) => void,
): Promise<void> {
  if (level.id !== 5) return;

  const piles = parsePoopPiles(level);
  if (piles.length === 0) return;

  for (const pile of piles) {
    const key = cellKey(pile.x, pile.y);
    const nowRevealed = next.revealed.has(key);
    const wasRevealed = prev.revealed.has(key);

    if (!flags.revealed && nowRevealed && !wasRevealed) {
      flags.revealed = true;
      for (const line of POOP_REVEAL_LINES) {
        onSpeech(line);
        await sleep(POOP_SPEECH_MS);
      }
      onSpeech(null);
    }

    if (
      !flags.smell &&
      !nowRevealed &&
      !flags.revealed
    ) {
      const dist = manhattanDistance(next.robot.x, next.robot.y, pile.x, pile.y);
      if (dist > 0 && dist <= POOP_SMELL_RADIUS) {
        flags.smell = true;
        onSpeech(POOP_SMELL_SPEECH);
        await sleep(POOP_SPEECH_MS);
        onSpeech(null);
      }
    }

    if (!flags.stepped && next.robot.x === pile.x && next.robot.y === pile.y) {
      flags.stepped = true;
      onSpeech(POOP_STEP_SPEECH);
      await sleep(POOP_SPEECH_MS);
      onSpeech(null);
    }
  }
}
