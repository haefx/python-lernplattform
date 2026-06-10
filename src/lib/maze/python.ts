import type { PyodideInterface } from "pyodide";
import { formatPythonError } from "../pythonErrors";
import { loadPyodideRuntime } from "../pyodide";
import type { MazeCommand } from "./types";

const MAX_COMMANDS = 80;

/** Gemeinsame Queue – JS-Bridge bleibt gleich, auch wenn Python erneut importiert. */
const commandBucket: { list: MazeCommand[] } = { list: [] };

const MAZE_BRIDGE_VERSION = 5;

let mazePyodideReady: Promise<void> | null = null;
let mazeBridgeVersion = 0;

function pushCommand(command: MazeCommand) {
  if (commandBucket.list.length >= MAX_COMMANDS) {
    throw new Error(`Maximal ${MAX_COMMANDS} Befehle pro Programm.`);
  }
  commandBucket.list.push(command);
}

function readSteps(value: unknown): number {
  const steps = typeof value === "number" ? value : 1;
  if (!Number.isFinite(steps) || steps < 1) return 1;
  return Math.floor(steps);
}

async function ensureMazePyodideBridge(pyodide: PyodideInterface): Promise<void> {
  if (mazePyodideReady && mazeBridgeVersion === MAZE_BRIDGE_VERSION) {
    await mazePyodideReady;
    return;
  }

  mazePyodideReady = null;
  mazeBridgeVersion = MAZE_BRIDGE_VERSION;

  mazePyodideReady = (async () => {
    pyodide.registerJsModule("pyto_robot", {
      vorwaerts: (schritte = 1) => {
        pushCommand({ type: "forward", steps: readSteps(schritte) });
      },
      rueckwaerts: (schritte = 1) => {
        pushCommand({ type: "backward", steps: readSteps(schritte) });
      },
      seitwaerts_links: (schritte = 1) => {
        pushCommand({ type: "strafe_left", steps: readSteps(schritte) });
      },
      seitwaerts_rechts: (schritte = 1) => {
        pushCommand({ type: "strafe_right", steps: readSteps(schritte) });
      },
      links: (schritte = 1) => {
        const n = readSteps(schritte);
        for (let i = 0; i < n; i += 1) {
          pushCommand({ type: "turn_left" });
        }
      },
      rechts: (schritte = 1) => {
        const n = readSteps(schritte);
        for (let i = 0; i < n; i += 1) {
          pushCommand({ type: "turn_right" });
        }
      },
      halten: () => {
        pushCommand({ type: "hold" });
      },
      aufladen: () => {
        pushCommand({ type: "charge" });
      },
      laser: () => {
        pushCommand({ type: "laser" });
      },
      fangen: () => {
        pushCommand({ type: "catch" });
      },
    });

    await pyodide.runPythonAsync(`
from pyto_robot import (
    vorwaerts,
    rueckwaerts,
    seitwaerts_links,
    seitwaerts_rechts,
    links,
    rechts,
    halten,
    aufladen,
    laser,
    fangen,
)
`);
  })();

  try {
    await mazePyodideReady;
  } catch (err) {
    mazePyodideReady = null;
    throw err;
  }
}

export async function runMazePython(code: string): Promise<{
  commands: MazeCommand[];
  error: string | null;
}> {
  commandBucket.list = [];

  const pyodide = await loadPyodideRuntime();

  try {
    await ensureMazePyodideBridge(pyodide);
    await pyodide.runPythonAsync(code);
    return { commands: [...commandBucket.list], error: null };
  } catch (err) {
    return { commands: [], error: formatPythonError(err) };
  }
}
