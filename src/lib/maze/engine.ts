import type {
  Direction,
  MazeBlockKind,
  MazeCommand,
  MazeLevelDef,
  MazeRuntimeState,
} from "./types";
import {
  cellKey,
  getStaticChar,
  isBrittleCell,
  isChargerCell,
  parseBugSpawn,
} from "./grid";
import { CHARGE_TICKS, LASER_FIRE_TICKS, LEVER_HOLD_TICKS } from "./types";
import { ensureEntranceBandRevealed, revealFromPosition } from "./vision";

const DIR_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  0: { dx: 0, dy: -1 },
  1: { dx: 1, dy: 0 },
  2: { dx: 0, dy: 1 },
  3: { dx: -1, dy: 0 },
};

/** Max. Felder Entfernung zum Beschuss (Pyto muss in Blickrichtung schauen). */
const LASER_RANGE = 12;

export function shouldStopMazeCommandBatch(state: MazeRuntimeState): boolean {
  if (state.status === "won" || state.status === "at_goal") return true;
  if (state.status === "blocked" && state.blockKind !== "action") return true;
  return false;
}

function turnLeft(dir: Direction): Direction {
  return ((dir + 3) % 4) as Direction;
}

function turnRight(dir: Direction): Direction {
  return ((dir + 1) % 4) as Direction;
}

function getStrafeVector(dir: Direction, side: "left" | "right"): { dx: number; dy: number } {
  const forward = DIR_VECTORS[dir];
  if (side === "left") return { dx: -forward.dy, dy: forward.dx };
  return { dx: forward.dy, dy: -forward.dx };
}

export function parseLevelGrid(level: MazeLevelDef): {
  width: number;
  height: number;
  start: { x: number; y: number };
  goal: { x: number; y: number };
  entrance: { x: number; y: number } | null;
  walls: Set<string>;
} {
  const height = level.rows.length;
  const width = Math.max(...level.rows.map((row) => row.length));
  const walls = new Set<string>();
  let start = { x: 0, y: 0 };
  let goal = { x: 0, y: 0 };
  let entrance: { x: number; y: number } | null = null;

  level.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      if (ch === "#") walls.add(cellKey(x, y));
      if (ch === "S") start = { x, y };
      if (ch === "G") goal = { x, y };
      if (ch === "E") entrance = { x, y };
    }
  });

  return { width, height, start, goal, entrance, walls };
}

function isEntranceCell(level: MazeLevelDef, x: number, y: number): boolean {
  const { entrance } = parseLevelGrid(level);
  return entrance !== null && entrance.x === x && entrance.y === y;
}

function isEntranceBlocked(
  level: MazeLevelDef,
  x: number,
  y: number,
  entranceClosed: boolean,
): boolean {
  return entranceClosed && isEntranceCell(level, x, y);
}

function isDoorClosed(
  level: MazeLevelDef,
  x: number,
  y: number,
  activatedLevers: Set<string>,
  bugCaught = false,
): boolean {
  const door = level.doors?.find((item) => item.x === x && item.y === y);
  if (!door) return false;
  if (level.id === 4 && door.id === "b1") return !bugCaught;
  const lever = level.levers?.find((item) => item.opens.includes(door.id));
  if (!lever) return true;
  return !activatedLevers.has(lever.id);
}

function isSolidWall(level: MazeLevelDef, x: number, y: number, walls: Set<string>): boolean {
  if (x < 0 || y < 0 || y >= level.rows.length) return true;
  const row = level.rows[y] ?? "";
  if (x >= row.length) return true;
  return walls.has(cellKey(x, y));
}

function visionContext(
  level: MazeLevelDef,
  state: Pick<
    MazeRuntimeState,
    "activatedLevers" | "entranceClosed" | "destroyedCells" | "bugCaught"
  >,
) {
  const { width, height, entrance } = parseLevelGrid(level);
  return {
    activatedLevers: state.activatedLevers,
    entranceClosed: state.entranceClosed,
    destroyedCells: state.destroyedCells,
    bugCaught: state.bugCaught,
    entrance,
    width,
    height,
  };
}

export function createInitialState(level: MazeLevelDef): MazeRuntimeState {
  const { start, entrance } = parseLevelGrid(level);
  const activatedLevers = new Set<string>();
  const destroyedCells = new Set<string>();
  const entranceClosed = true;
  const base = { activatedLevers, entranceClosed, destroyedCells, bugCaught: false };
  const bugSpawn = level.id === 4 ? parseBugSpawn(level) : null;

  return {
    robot: { x: start.x, y: start.y, dir: 1 },
    activatedLevers,
    leverHoldProgress: {},
    chargeProgress: 0,
    laserReady: false,
    laserFireProgress: 0,
    laserTarget: null,
    destroyedCells,
    revealed: ensureEntranceBandRevealed(
      revealFromPosition(level, new Set(), start.x, start.y, visionContext(level, base)),
      entrance,
    ),
    entranceClosed,
    bugPosition: bugSpawn ? { ...bugSpawn } : null,
    bugCaught: false,
    blockKind: null,
    status: "idle",
    message: null,
  };
}

function leverAt(level: MazeLevelDef, x: number, y: number) {
  return level.levers?.find((item) => item.x === x && item.y === y);
}

function resetLeverHoldOnMove(
  level: MazeLevelDef,
  state: MazeRuntimeState,
  nx: number,
  ny: number,
): Record<string, number> {
  const progress = { ...state.leverHoldProgress };

  for (const lever of level.levers ?? []) {
    if (state.activatedLevers.has(lever.id)) continue;
    const wasOnLever = state.robot.x === lever.x && state.robot.y === lever.y;
    const stillOnLever = nx === lever.x && ny === lever.y;
    if (wasOnLever && !stillOnLever && progress[lever.id]) {
      delete progress[lever.id];
    }
  }

  return progress;
}

function resetChargeOnMove(
  level: MazeLevelDef,
  state: MazeRuntimeState,
  nx: number,
  ny: number,
): number {
  if (state.laserReady) return state.chargeProgress;
  const wasOnCharger = isChargerCell(level, state.robot.x, state.robot.y);
  const stillOnCharger = isChargerCell(level, nx, ny);
  if (wasOnCharger && !stillOnCharger && state.chargeProgress > 0) {
    return 0;
  }
  return state.chargeProgress;
}

function applyHold(level: MazeLevelDef, state: MazeRuntimeState): MazeRuntimeState {
  const lever = leverAt(level, state.robot.x, state.robot.y);

  if (!lever) {
    return {
      ...state,
      status: "blocked",
      blockKind: "action",
      message: "Pyto steht nicht auf einem Hebel!",
    };
  }

  if (state.activatedLevers.has(lever.id)) {
    return { ...state, status: "running", message: null };
  }

  const current = state.leverHoldProgress[lever.id] ?? 0;
  const nextTicks = Math.min(current + 1, LEVER_HOLD_TICKS);
  const leverHoldProgress = { ...state.leverHoldProgress, [lever.id]: nextTicks };

  if (nextTicks < LEVER_HOLD_TICKS) {
    return {
      ...state,
      leverHoldProgress,
      status: "running",
      message: `Hebel halten … ${nextTicks}/${LEVER_HOLD_TICKS}`,
    };
  }

  const activatedLevers = new Set(state.activatedLevers);
  activatedLevers.add(lever.id);

  return {
    ...state,
    leverHoldProgress,
    activatedLevers,
    status: "running",
    message: "Hebel aktiviert! Das Tor öffnet sich.",
  };
}

function applyCharge(level: MazeLevelDef, state: MazeRuntimeState): MazeRuntimeState {
  if (!isChargerCell(level, state.robot.x, state.robot.y)) {
    return {
      ...state,
      status: "blocked",
      blockKind: "action",
      message: "Pyto steht nicht auf der Ladestation!",
    };
  }

  if (state.laserReady) {
    return { ...state, status: "running", message: "Laser ist schon aufgeladen!" };
  }

  const nextTicks = Math.min(state.chargeProgress + 1, CHARGE_TICKS);

  if (nextTicks < CHARGE_TICKS) {
    return {
      ...state,
      chargeProgress: nextTicks,
      status: "running",
      message: `Aufladen … ${nextTicks}/${CHARGE_TICKS}`,
    };
  }

  return {
    ...state,
    chargeProgress: CHARGE_TICKS,
    laserReady: true,
    status: "running",
    message: "Laser aufgeladen! Jetzt kannst du laser() feuern.",
  };
}

function getActiveBrittleCells(
  level: MazeLevelDef,
  destroyedCells: Set<string>,
): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < level.rows.length; y += 1) {
    const row = level.rows[y] ?? "";
    for (let x = 0; x < row.length; x += 1) {
      if (isBrittleCell(level, x, y, destroyedCells)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

function cardinalDistance(
  from: { x: number; y: number },
  to: { x: number; y: number },
): number {
  if (from.x !== to.x && from.y !== to.y) return Infinity;
  return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
}

function isFacingToward(
  robot: MazeRuntimeState["robot"],
  target: { x: number; y: number },
): boolean {
  const dx = target.x - robot.x;
  const dy = target.y - robot.y;
  if (dx === 0 && dy === 0) return false;

  const facing = DIR_VECTORS[robot.dir];
  if (facing.dx !== 0) {
    return dy === 0 && Math.sign(dx) === Math.sign(facing.dx);
  }
  return dx === 0 && Math.sign(dy) === Math.sign(facing.dy);
}

function isBeamBlockedBeforeBrittle(
  level: MazeLevelDef,
  state: Pick<MazeRuntimeState, "robot" | "destroyedCells" | "activatedLevers">,
  target: { x: number; y: number },
): boolean {
  const vector = DIR_VECTORS[state.robot.dir];
  let x = state.robot.x + vector.dx;
  let y = state.robot.y + vector.dy;

  while (x !== target.x || y !== target.y) {
    const ch = getStaticChar(level, x, y);
    if (ch === "#" || isDoorClosed(level, x, y, state.activatedLevers)) {
      return true;
    }
    x += vector.dx;
    y += vector.dy;
  }

  return false;
}

/** Hilfetext, wenn laser() nicht zielen kann (Laser muss aufgeladen sein). */
export function getLaserAimMessage(
  level: MazeLevelDef,
  state: Pick<MazeRuntimeState, "robot" | "destroyedCells" | "activatedLevers">,
): string {
  const brittleCells = getActiveBrittleCells(level, state.destroyedCells);
  if (brittleCells.length === 0) {
    return "Keine brüchige Mauer mehr im Level.";
  }

  const wall = brittleCells[0];
  const { robot } = state;
  const distance = cardinalDistance(robot, wall);

  if (!Number.isFinite(distance)) {
    return "Geh direkt vor die brüchige Mauer – schräg daneben reicht nicht! Steh in derselben Reihe oder Spalte wie die Mauer.";
  }

  if (!isFacingToward(robot, wall)) {
    return "Dreh Pyto zur brüchigen Mauer – er schaut noch in die falsche Richtung!";
  }

  if (isBeamBlockedBeforeBrittle(level, state, wall)) {
    return "Etwas blockiert den Laserstrahl – such freie Sicht zur brüchigen Mauer!";
  }

  if (distance > LASER_RANGE) {
    return `Pyto ist zu weit von der Mauer entfernt (${distance} Felder). Geh näher heran – direkt davor stehen!`;
  }

  if (distance > 1) {
    return `Pyto ist noch ${distance} Felder von der Mauer entfernt. Geh direkt vor die brüchige Mauer (1 Feld Abstand)!`;
  }

  return "Keine brüchige Mauer im Visier!";
}

export function findBrittleInBeam(
  level: MazeLevelDef,
  state: Pick<MazeRuntimeState, "robot" | "destroyedCells" | "activatedLevers">,
): { x: number; y: number } | null {
  const { width, height } = parseLevelGrid(level);
  const vector = DIR_VECTORS[state.robot.dir];
  const destroyedCells = state.destroyedCells;
  let x = state.robot.x + vector.dx;
  let y = state.robot.y + vector.dy;

  for (let step = 0; step < LASER_RANGE; step += 1) {
    if (x < 0 || y < 0 || x >= width || y >= height) return null;

    if (isBrittleCell(level, x, y, destroyedCells)) {
      const dist = Math.max(Math.abs(x - state.robot.x), Math.abs(y - state.robot.y));
      if (dist === 1) {
        return { x, y };
      }
      return null;
    }

    const ch = getStaticChar(level, x, y);
    if (ch === "#" || isDoorClosed(level, x, y, state.activatedLevers)) {
      return null;
    }

    x += vector.dx;
    y += vector.dy;
  }

  return null;
}

function applyLaser(level: MazeLevelDef, state: MazeRuntimeState): MazeRuntimeState {
  if (!state.laserReady) {
    return {
      ...state,
      status: "blocked",
      blockKind: "action",
      message: "Laser nicht aufgeladen! Finde zuerst die Ladestation.",
    };
  }

  const target = findBrittleInBeam(level, state);
  if (!target) {
    return {
      ...state,
      laserFireProgress: 0,
      laserTarget: null,
      status: "blocked",
      blockKind: "action",
      message: getLaserAimMessage(level, state),
    };
  }

  const sameTarget =
    state.laserTarget?.x === target.x && state.laserTarget?.y === target.y;
  const currentProgress = sameTarget ? state.laserFireProgress : 0;
  const nextProgress = Math.min(currentProgress + 1, LASER_FIRE_TICKS);

  const destroyedCells = new Set(state.destroyedCells);
  let revealed = revealFromPosition(
    level,
    state.revealed,
    target.x,
    target.y,
    visionContext(level, { ...state, destroyedCells }),
  );

  if (nextProgress < LASER_FIRE_TICKS) {
    return {
      ...state,
      revealed,
      laserFireProgress: nextProgress,
      laserTarget: target,
      status: "running",
      message: `Laser feuert … ${nextProgress}/${LASER_FIRE_TICKS}`,
    };
  }

  destroyedCells.add(cellKey(target.x, target.y));

  return {
    ...state,
    destroyedCells,
    revealed,
    laserReady: false,
    chargeProgress: 0,
    laserFireProgress: 0,
    laserTarget: null,
    status: "running",
    message: "Zack! Die brüchige Mauer ist weg!",
  };
}

function getMoveBlockKind(
  level: MazeLevelDef,
  x: number,
  y: number,
  walls: Set<string>,
  activatedLevers: Set<string>,
  entranceClosed: boolean,
  destroyedCells: Set<string>,
  bugCaught: boolean,
): MazeBlockKind {
  if (isSolidWall(level, x, y, walls)) return "wall";
  if (isBrittleCell(level, x, y, destroyedCells)) return "wall";
  if (isDoorClosed(level, x, y, activatedLevers, bugCaught)) return "door";
  if (isEntranceBlocked(level, x, y, entranceClosed)) return "entrance";
  return "wall";
}

function canWalkTo(
  level: MazeLevelDef,
  x: number,
  y: number,
  walls: Set<string>,
  activatedLevers: Set<string>,
  entranceClosed: boolean,
  destroyedCells: Set<string>,
  bugCaught: boolean,
): boolean {
  if (isSolidWall(level, x, y, walls)) return false;
  if (isBrittleCell(level, x, y, destroyedCells)) return false;
  if (isDoorClosed(level, x, y, activatedLevers, bugCaught)) return false;
  if (isEntranceBlocked(level, x, y, entranceClosed)) return false;
  return true;
}

function applyCatch(level: MazeLevelDef, state: MazeRuntimeState): MazeRuntimeState {
  if (level.id !== 4) {
    return {
      ...state,
      status: "blocked",
      blockKind: "action",
      message: "fangen() gibt es hier nicht!",
    };
  }

  if (state.bugCaught) {
    return { ...state, status: "running", message: "Der Bug ist schon gefangen!" };
  }

  if (
    !state.bugPosition ||
    state.robot.x !== state.bugPosition.x ||
    state.robot.y !== state.bugPosition.y
  ) {
    return {
      ...state,
      status: "blocked",
      blockKind: "action",
      message: "Hier ist kein Bug zum Fangen – stell dich auf dasselbe Feld!",
    };
  }

  return {
    ...state,
    bugCaught: true,
    bugPosition: null,
    status: "running",
    message: "Gotcha! Bug gefangen – das Tor öffnet sich!",
  };
}

function moveRobot(
  level: MazeLevelDef,
  state: MazeRuntimeState,
  dx: number,
  dy: number,
): MazeRuntimeState {
  const { width, height, goal, walls } = parseLevelGrid(level);
  const nx = state.robot.x + dx;
  const ny = state.robot.y + dy;

  if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
    return {
      ...state,
      status: "blocked",
      blockKind: "wall",
      message: null,
    };
  }

  if (
    !canWalkTo(
      level,
      nx,
      ny,
      walls,
      state.activatedLevers,
      state.entranceClosed,
      state.destroyedCells,
      state.bugCaught,
    )
  ) {
    const blockKind = getMoveBlockKind(
      level,
      nx,
      ny,
      walls,
      state.activatedLevers,
      state.entranceClosed,
      state.destroyedCells,
      state.bugCaught,
    );

    return {
      ...state,
      status: "blocked",
      blockKind,
      message:
        blockKind === "wall"
          ? null
          : blockKind === "door"
            ? "Hier ist ein geschlossenes Tor!"
            : "Der Eingang ist noch verschlossen!",
    };
  }

  const leverHoldProgress = resetLeverHoldOnMove(level, state, nx, ny);
  const chargeProgress = resetChargeOnMove(level, state, nx, ny);
  const revealed = revealFromPosition(
    level,
    state.revealed,
    nx,
    ny,
    visionContext(level, state),
  );
  const atGoal = nx === goal.x && ny === goal.y;

  return {
    robot: { ...state.robot, x: nx, y: ny },
    activatedLevers: state.activatedLevers,
    leverHoldProgress,
    chargeProgress,
    laserReady: state.laserReady,
    laserFireProgress: state.laserFireProgress,
    laserTarget: state.laserTarget,
    destroyedCells: state.destroyedCells,
    revealed,
    entranceClosed: state.entranceClosed,
    bugPosition: state.bugPosition,
    bugCaught: state.bugCaught,
    blockKind: null,
    status: atGoal ? "at_goal" : "running",
    message: null,
  };
}

export function applyCommand(
  level: MazeLevelDef,
  state: MazeRuntimeState,
  command: MazeCommand,
): MazeRuntimeState {
  if (state.status === "won" || state.status === "at_goal") {
    return state;
  }

  if (shouldStopMazeCommandBatch(state)) {
    return state;
  }

  if (command.type === "hold") {
    return applyHold(level, state);
  }

  if (command.type === "charge") {
    return applyCharge(level, state);
  }

  if (command.type === "laser") {
    return applyLaser(level, state);
  }

  if (command.type === "catch") {
    return applyCatch(level, state);
  }

  if (command.type === "turn_left") {
    return {
      ...state,
      robot: { ...state.robot, dir: turnLeft(state.robot.dir) },
      status: "running",
    };
  }

  if (command.type === "turn_right") {
    return {
      ...state,
      robot: { ...state.robot, dir: turnRight(state.robot.dir) },
      status: "running",
    };
  }

  const steps = Math.max(1, Math.min(command.steps, 20));
  let next: MazeRuntimeState = { ...state, status: "running", message: null };

  for (let i = 0; i < steps; i += 1) {
    if (next.status === "blocked" || next.status === "at_goal" || next.status === "won") {
      break;
    }

    let dx = 0;
    let dy = 0;

    if (command.type === "forward") {
      const v = DIR_VECTORS[next.robot.dir];
      dx = v.dx;
      dy = v.dy;
    } else if (command.type === "backward") {
      const v = DIR_VECTORS[next.robot.dir];
      dx = -v.dx;
      dy = -v.dy;
    } else if (command.type === "strafe_left") {
      const v = getStrafeVector(next.robot.dir, "left");
      dx = v.dx;
      dy = v.dy;
    } else if (command.type === "strafe_right") {
      const v = getStrafeVector(next.robot.dir, "right");
      dx = v.dx;
      dy = v.dy;
    }

    next = moveRobot(level, next, dx, dy);
  }

  return next;
}

export function applyCommands(
  level: MazeLevelDef,
  initial: MazeRuntimeState,
  commands: MazeCommand[],
): MazeRuntimeState {
  const start: MazeRuntimeState = { ...initial, status: "running", message: null };
  return commands.reduce(
    (state, command) => applyCommand(level, state, command),
    start,
  );
}

export function getCellSymbol(
  level: MazeLevelDef,
  x: number,
  y: number,
  state: MazeRuntimeState,
): string {
  const ch = getStaticChar(level, x, y);
  const isRobot = state.robot.x === x && state.robot.y === y;

  if (isRobot) return "P";

  if (ch === "B") {
    return isBrittleCell(level, x, y, state.destroyedCells) ? "B" : ".";
  }
  if (ch === "#") return "#";
  if (ch === "E") return "E";
  if (ch === "G") return "G";
  if (ch === "F") return "F";
  if (ch === "C") return "C";
  if (ch === "K") return "K";
  if (
    level.id === 4 &&
    state.bugPosition &&
    !state.bugCaught &&
    state.bugPosition.x === x &&
    state.bugPosition.y === y
  ) {
    return "🐛";
  }
  if (ch === "H" || ch === "L") {
    const lever = level.levers?.find((item) => item.x === x && item.y === y);
    if (lever && state.activatedLevers.has(lever.id)) return "h";
    return "H";
  }
  if (ch === "T" || ch === "D") {
    if (!isDoorClosed(level, x, y, state.activatedLevers, state.bugCaught)) return ".";
    return "T";
  }

  return ch === "S" ? "." : ch;
}
