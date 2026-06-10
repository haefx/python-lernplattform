import { sleep } from "./animation";
import type { MazeRobot } from "./types";

export const LEVEL3_STORY_MOVE_TRIGGER = 5;

export const LEVEL3_PYTO_SHAKE_SPEECH =
  "Was zum ... was passiert hier? Was hast du geschrieben???";

export const LEVEL3_DEVIL_SPEECH = "MUHAHAHA";

export const LEVEL3_PYTO_AFTER_SPEECH = "Was zur Hölle war das ...?";

export const LEVEL3_PYTO_RESUME_SPEECH =
  "Okey es scheint weg, lass uns bloß schnell den Ausgang finden";

export interface Level3DevilState {
  visible: boolean;
  speech: string | null;
}

export interface Level3StoryCallbacks {
  onShake: (active: boolean) => void;
  onPytoSpeech: (text: string | null) => void;
  onDevil: (devil: Level3DevilState) => void;
}

export async function playLevel3Story(
  callbacks: Level3StoryCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  function abortable(ms: number) {
    return sleep(ms, signal);
  }

  callbacks.onDevil({ visible: false, speech: null });
  callbacks.onPytoSpeech(null);
  callbacks.onShake(false);

  await abortable(1000);

  callbacks.onShake(true);
  callbacks.onPytoSpeech(LEVEL3_PYTO_SHAKE_SPEECH);
  callbacks.onDevil({ visible: true, speech: null });

  await abortable(2000);
  callbacks.onDevil({ visible: true, speech: LEVEL3_DEVIL_SPEECH });

  await abortable(1000);
  await abortable(3000);

  callbacks.onDevil({ visible: false, speech: null });
  callbacks.onShake(false);

  await abortable(1000);
  callbacks.onPytoSpeech(LEVEL3_PYTO_AFTER_SPEECH);
  await abortable(2800);

  callbacks.onPytoSpeech(LEVEL3_PYTO_RESUME_SPEECH);
  await abortable(2800);

  callbacks.onPytoSpeech(null);
  callbacks.onDevil({ visible: false, speech: null });
}

export function isMoveCommand(command: { type: string }): boolean {
  return (
    command.type === "forward" ||
    command.type === "backward" ||
    command.type === "strafe_left" ||
    command.type === "strafe_right"
  );
}

export function cellInFrontOfRobot(robot: MazeRobot): { x: number; y: number } {
  const vectors: Record<MazeRobot["dir"], { dx: number; dy: number }> = {
    0: { dx: 0, dy: -1 },
    1: { dx: 1, dy: 0 },
    2: { dx: 0, dy: 1 },
    3: { dx: -1, dy: 0 },
  };
  const vector = vectors[robot.dir];
  return { x: robot.x + vector.dx, y: robot.y + vector.dy };
}
