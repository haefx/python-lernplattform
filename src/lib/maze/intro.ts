import { MAZE_MOVE_MS, MAZE_TURN_MS } from "./animation";
import { parseLevelGrid } from "./engine";
import type { Direction, MazeLevelDef, MazeRobot } from "./types";

export type MazeIntroPhase =
  | "idle"
  | "gate-open"
  | "entering"
  | "gate-close"
  | "look-around"
  | "speech"
  | "done";

function buildEnterPath(
  entrance: { x: number; y: number },
  start: { x: number; y: number },
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  let x = entrance.x;
  let y = entrance.y;

  while (x !== start.x || y !== start.y) {
    if (x < start.x) x += 1;
    else if (x > start.x) x -= 1;
    else if (y < start.y) y += 1;
    else if (y > start.y) y -= 1;
    path.push({ x, y });
  }

  return path;
}

function facingIntoMaze(
  entrance: { x: number; y: number },
  start: { x: number; y: number },
): Direction {
  if (start.y > entrance.y) return 2;
  if (start.y < entrance.y) return 0;
  if (start.x > entrance.x) return 1;
  return 3;
}

export interface MazeIntroCallbacks {
  onPhase: (phase: MazeIntroPhase) => void;
  onEntranceOpen: (open: boolean) => void;
  onRobot: (robot: MazeRobot | null) => void;
  onSpeech: (visible: boolean) => void;
}

export async function playMazeIntro(
  level: MazeLevelDef,
  callbacks: MazeIntroCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const { entrance, start } = parseLevelGrid(level);

  if (!entrance) {
    callbacks.onPhase("done");
    callbacks.onRobot(null);
    callbacks.onSpeech(false);
    callbacks.onEntranceOpen(false);
    return;
  }

  const enterDir = facingIntoMaze(entrance, start);
  const enterPath = buildEnterPath(entrance, start);
  const lookDirs: Direction[] = [
    ((enterDir + 3) % 4) as Direction,
    ((enterDir + 1) % 4) as Direction,
    enterDir,
  ];

  function abortable(ms: number) {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("Intro abgebrochen", "AbortError"));
        },
        { once: true },
      );
    });
  }

  try {
    callbacks.onPhase("gate-open");
    callbacks.onEntranceOpen(true);
    callbacks.onRobot({ x: entrance.x, y: entrance.y, dir: enterDir });
    await abortable(700);

    callbacks.onPhase("entering");
    for (const step of enterPath) {
      callbacks.onRobot({ x: step.x, y: step.y, dir: enterDir });
      await abortable(MAZE_MOVE_MS);
    }

    callbacks.onPhase("gate-close");
    callbacks.onEntranceOpen(false);
    await abortable(600);

    callbacks.onPhase("look-around");
    for (const dir of lookDirs) {
      callbacks.onRobot({ x: start.x, y: start.y, dir });
      await abortable(MAZE_TURN_MS);
    }

    callbacks.onPhase("speech");
    callbacks.onRobot({ x: start.x, y: start.y, dir: enterDir });
    callbacks.onSpeech(true);
    await abortable(3200);

    callbacks.onSpeech(false);
    callbacks.onRobot(null);
    callbacks.onPhase("done");
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    throw err;
  }
}
