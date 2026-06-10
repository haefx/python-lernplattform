export const MAZE_EXIT_SPEECH =
  "Na super, ich komme hier wohl nur raus wenn ich diese Aufgabe löse …";

export const MAZE_EXIT_MODAL_DELAY_MS = 3000;

export interface MazeExitChallenge {
  levelId: number;
  title: string;
  task: string;
  starterCode: string;
  tips: string[];
  /** Exakter stdout (ohne trailing Newline). */
  expectedOutput?: string;
  /** Zeilenweise exakte Ausgabe. */
  expectedLines?: string[];
}

export const MAZE_EXIT_CHALLENGES: MazeExitChallenge[] = [
  {
    levelId: 1,
    title: "Tür-Code",
    task:
      "Der Ausgang ist mit einem **Python-Schloss** gesichert. Schreibe ein kurzes Programm mit `print()`, das genau die Zeile **Tür auf** ausgibt.",
    starterCode: "# Mit print() die richtige Zeile ausgeben:\n",
    tips: [
      "Mit **print()** sendest du Text zur Ausgabe – der Text steht in Anführungszeichen.",
      "So geht's: `print(\"dein Text\")` – welcher Text öffnet die Tür?",
      "Gib **genau** `Tür auf` aus – Groß- und Kleinschreibung beachten!",
    ],
    expectedOutput: "Tür auf",
  },
  {
    levelId: 2,
    title: "Hebel-Schleife",
    task:
      "Der Ausgang braucht **5 Sekunden Hebel-Halten**. Simuliere das mit einer `for`-Schleife: Gib **5×** die Zeile `halten` aus (jede in einer eigenen Zeile).",
    starterCode: "for i in range(5):\n    # print(...) hier einfügen\n",
    tips: [
      "Eine **for-Schleife** wiederholt Code: `for i in range(5):` läuft 5-mal.",
      "Unter der Schleife muss der Code **eingerückt** sein – mit 4 Leerzeichen.",
      "In der Schleife: `print(\"halten\")` – dann erscheint die Zeile fünfmal.",
    ],
    expectedLines: ["halten", "halten", "halten", "halten", "halten"],
  },
  {
    levelId: 3,
    title: "Laser-Salve",
    task:
      "Der Ausgangs-Scanner will **3 Laser-Impulse** sehen. Schreibe eine `for`-Schleife mit `range(3)`, die **3×** `pew!` ausgibt.",
    starterCode: "for i in range(3):\n    \n",
    tips: [
      "Drei Impulse heißt: `range(3)` – nicht vergessen, bei `range` startet die Zählung bei 0!",
      "Der Schleifenkörper braucht **Einrückung** (4 Leerzeichen).",
      "In der Schleife: `print(\"pew!\")` – dreimal feuern, dann passt's.",
    ],
    expectedLines: ["pew!", "pew!", "pew!"],
  },
  {
    levelId: 4,
    title: "Debug-Passwort",
    task:
      "Der **echte** Ausgang verlangt zwei Zeilen Output: Zuerst `404`, dann `Bug gefangen`. Schreibe **zwei** `print()`-Aufrufe – einen pro Zeile.",
    starterCode: "# Zwei print()-Zeilen:\n",
    tips: [
      "Jede Ausgabezeile braucht einen eigenen **print()**-Aufruf.",
      "Die **erste** Zeile soll genau `404` sein – ohne Extra-Text.",
      "Die **zweite** Zeile: `Bug gefangen` – danach öffnet sich der Weg!",
    ],
    expectedLines: ["404", "Bug gefangen"],
  },
];

export function getMazeExitChallenge(levelId: number): MazeExitChallenge | undefined {
  return MAZE_EXIT_CHALLENGES.find((item) => item.levelId === levelId);
}

function normalizeStdout(stdout: string): string {
  return stdout.replace(/\r\n/g, "\n").trimEnd();
}

export function validateMazeExitChallenge(
  challenge: MazeExitChallenge,
  stdout: string,
  error: string | null,
): boolean {
  if (error) return false;

  const out = normalizeStdout(stdout);

  if (challenge.expectedOutput !== undefined) {
    return out.trim() === challenge.expectedOutput.trim();
  }

  if (challenge.expectedLines) {
    const lines = out
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length !== challenge.expectedLines.length) return false;
    return challenge.expectedLines.every((line, index) => lines[index] === line);
  }

  return false;
}
