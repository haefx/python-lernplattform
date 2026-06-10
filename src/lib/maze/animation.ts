import type { MazeCommand } from "./types";

export const MAZE_MOVE_MS = 320;
export const MAZE_TURN_MS = 240;
export const MAZE_HOLD_MS = 1000;
export const MAZE_CHARGE_MS = 1000;
export const MAZE_LASER_MS = 1000;
export const MAZE_EXPLOSION_MS = 700;

export function expandMazeCommands(commands: MazeCommand[]): MazeCommand[] {
  const expanded: MazeCommand[] = [];

  for (const command of commands) {
    if (
      command.type === "turn_left" ||
      command.type === "turn_right" ||
      command.type === "hold" ||
      command.type === "charge" ||
      command.type === "laser" ||
      command.type === "catch"
    ) {
      expanded.push(command);
      continue;
    }

    const steps = Math.max(1, command.steps);
    for (let step = 0; step < steps; step += 1) {
      expanded.push({ ...command, steps: 1 });
    }
  }

  return expanded;
}

export function commandDelayMs(command: MazeCommand): number {
  if (command.type === "catch") return MAZE_TURN_MS;
  if (command.type === "hold") return MAZE_HOLD_MS;
  if (command.type === "charge") return MAZE_CHARGE_MS;
  if (command.type === "laser") return MAZE_LASER_MS;
  if (command.type === "turn_left" || command.type === "turn_right") {
    return MAZE_TURN_MS;
  }
  return MAZE_MOVE_MS;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Abgebrochen", "AbortError"));
      return;
    }

    const timer = setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Abgebrochen", "AbortError"));
      },
      { once: true },
    );
  });
}
