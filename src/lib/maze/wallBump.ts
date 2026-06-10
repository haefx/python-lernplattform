import type { MutableRefObject } from "react";
import { sleep } from "./animation";
import type { MazeBlockKind } from "./types";

export const WALL_BUMP_SHAKE_MS = 520;
export const WALL_BUMP_SPEECH_MS = 2600;

export const WALL_BUMP_SPEECH = [
  "Aua … hey, da ist eine Wand!",
  "Autsch! Das machst du mit Absicht!",
  "ARGH … Wand vorraus!!!",
  "Lack gesoffen? … oh man, schon wieder ein Kratzer",
  "Aua … HEY … das ist Roboter-Mobbing!",
] as const;

export function isWallBumpBlock(blockKind: MazeBlockKind | null | undefined): boolean {
  return blockKind === "wall";
}

export function getWallBumpSpeech(hitCount: number): string {
  const index = Math.min(Math.max(hitCount, 1), WALL_BUMP_SPEECH.length) - 1;
  return WALL_BUMP_SPEECH[index];
}

async function waitForPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function playWallBumpFeedback(
  hitCountRef: MutableRefObject<number>,
  onSpeech: (text: string | null) => void,
  onBumping: (active: boolean) => void,
): Promise<void> {
  hitCountRef.current += 1;
  onSpeech(getWallBumpSpeech(hitCountRef.current));
  onBumping(true);
  await waitForPaint();
  await sleep(WALL_BUMP_SHAKE_MS);
  onBumping(false);
  await sleep(Math.max(0, WALL_BUMP_SPEECH_MS - WALL_BUMP_SHAKE_MS));
  onSpeech(null);
}
