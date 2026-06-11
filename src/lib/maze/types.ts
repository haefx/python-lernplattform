export type Direction = 0 | 1 | 2 | 3; // N, E, S, W

/** Halte-/Lade-Schritte (1 Schritt = 1 Sekunde im Spiel). */
export const LEVER_HOLD_TICKS = 5;
export const CHARGE_TICKS = 5;
export const LASER_FIRE_TICKS = 3;

export type MazeCommand =
  | { type: "forward"; steps: number }
  | { type: "backward"; steps: number }
  | { type: "strafe_left"; steps: number }
  | { type: "strafe_right"; steps: number }
  | { type: "turn_left" }
  | { type: "turn_right" }
  | { type: "catch" }
  | { type: "hold" }
  | { type: "charge" }
  | { type: "laser" };

export interface MazeLever {
  id: string;
  x: number;
  y: number;
  opens: string[];
}

export interface MazeDoor {
  id: string;
  x: number;
  y: number;
}

export interface MazeLevelDef {
  id: number;
  title: string;
  description: string;
  greeting: string;
  /** Sprechblase direkt nach dem Betreten (Intro). */
  introSpeech: string;
  rows: string[];
  levers?: MazeLever[];
  doors?: MazeDoor[];
  starterCode: string;
  comingSoon?: boolean;
}

export interface MazeRobot {
  x: number;
  y: number;
  dir: Direction;
}

export type MazeRunStatus =
  | "idle"
  | "running"
  | "at_goal"
  | "won"
  | "blocked"
  | "error";

/** Warum Pyto blockiert ist (nur bei status === "blocked"). */
export type MazeBlockKind = "wall" | "door" | "entrance" | "action";

export interface MazeRuntimeState {
  robot: MazeRobot;
  activatedLevers: Set<string>;
  /** Fortschritt pro Hebel-ID (0 … LEVER_HOLD_TICKS). */
  leverHoldProgress: Record<string, number>;
  /** Ladefortschritt an der Ladestation (0 … CHARGE_TICKS). */
  chargeProgress: number;
  /** Laser bereit nach vollem Aufladen (verbraucht sich nach Zerstörung). */
  laserReady: boolean;
  /** Fortschritt beim Beschuss einer brüchigen Mauer (0 … LASER_FIRE_TICKS). */
  laserFireProgress: number;
  /** Ziel der aktuellen Laser-Salve. */
  laserTarget: { x: number; y: number } | null;
  /** Zerstörte brüchige Mauern (Zell-Schlüssel „x,y“). */
  destroyedCells: Set<string>;
  revealed: Set<string>;
  entranceClosed: boolean;
  /** Level 4: Bug-Position (wandert durchs Labyrinth). */
  bugPosition: { x: number; y: number } | null;
  bugCaught: boolean;
  /** Level 4: Erster Fangversuch scheitert – Bug entkommt. */
  bugSlipperyEscaped: boolean;
  blockKind: MazeBlockKind | null;
  status: MazeRunStatus;
  message: string | null;
}
