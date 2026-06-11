import type { MazeLevelDef } from "./types";

export const MAZE_LEVELS: MazeLevelDef[] = [
  {
    id: 1,
    title: "Level 1 – Nebel und erste Schritte",
    description:
      "Finde den Ausgang! Folge den Gängen durch das Labyrinth – von Tor zu Tor.",
    greeting:
      "Hallo! Ich bin Pyto. Schön, dass du da bist! Hilf mir mit Python-Code durch die Gänge – ich zähle auf dich!",
    introSpeech: "Ohje, wie komme ich hier nur wieder raus?",
    rows: [
      "#E########G#",
      "#S#........#",
      "#.#####.#.##",
      "#.#.....#.##",
      "#.#.#####.##",
      "#...#...#.##",
      "#####.#.#.##",
      "#.....#.#.##",
      "#.#.#####.##",
      "#.#.......##",
      "############",
      "############",
    ],
    starterCode: `vorwaerts()
`,
  },
  {
    id: 2,
    title: "Level 2 – Hebel und Tore",
    description:
      "Halte den Hebel 5 Sekunden mit einer Schleife und `halten()` – dann öffnet sich das Tor im Gang.",
    greeting:
      "Willkommen zurück! Manche Hebel brauchen 5 Sekunden. Jeder Aufruf von halten() hält 1 Sekunde – schreib eine Schleife mit 5 Durchläufen!",
    introSpeech: "Okey, dann noch einmal den Ausgang finden …",
    rows: [
      "#E########G#",
      "#S#........#",
      "#.#####.#.##",
      "#.#H.T..#.##",
      "#.#.#####.##",
      "#...#...#.##",
      "#####.#.#.##",
      "#.....#.#.##",
      "#.#.#####.##",
      "#.#.......##",
      "############",
      "############",
    ],
    levers: [{ id: "h1", x: 3, y: 3, opens: ["t1"] }],
    doors: [{ id: "t1", x: 5, y: 3 }],
    starterCode: `vorwaerts()
# Finde den Hebel im Gang und halte ihn 5 Sekunden:
# for i in range(5): halten()
`,
  },
  {
    id: 3,
    title: "Level 3 – Laser und Ladestation",
    description:
      "Lade den Laser auf (`aufladen()`), feuere 3× `laser()` auf die brüchige Mauer – und meistere Hebel und Tore!",
    greeting:
      "Neues Upgrade! Erst zur Ladestation neben dir und 5× aufladen() – dann zerstört der Laser die brüchige Mauer im Gang. Danach warten noch Hebel und Tor!",
    introSpeech: "Da sind wir wieder … *seufz* Auf ein Neues!",
    rows: [
      "#E########G#",
      "#S#........#",
      "#C#####.#.##",
      "#.#H.T..#.##",
      "#B#.#####.##",
      "#...K...#.##",
      "#####.#.#.##",
      "#.....#.#.##",
      "#.#.#####.##",
      "#.#.......##",
      "############",
      "############",
    ],
    levers: [{ id: "h1", x: 3, y: 3, opens: ["t1"] }],
    doors: [{ id: "t1", x: 5, y: 3 }],
    starterCode: `vorwaerts()
# Laser: for i in range(5): aufladen()
# Direkt vor die Mauer stellen, drehen, dann: for i in range(3): laser()
`,
  },
  {
    id: 4,
    title: "Level 4 – Achtung Bug!",
    description: "Finde den Ausgang und beseitige den Bug.",
    greeting:
      'Noch ein Labyrinth – hier hat sich aber wohl ein "Bug" eingeschlichen. Hilf mir zum Ausgang.',
    introSpeech: "Okay … und los geht's wieder.",
    rows: [
      "#E########G#",
      "#S#...F....#",
      "#.###T#.#.##",
      "#.#.....#.##",
      "#.#.#####.##",
      "#...X...#.##",
      "#####.#.#.##",
      "#.....#.#.##",
      "#.#.#####.##",
      "#.#.......##",
      "############",
      "############",
    ],
    doors: [{ id: "b1", x: 5, y: 2 }],
    starterCode: `vorwaerts()
`,
  },
];

export const MAZE_WIN_THANKS_SPEECH =
  "Danke, dass du mir geholfen hast! Du hast den Ausgang gefunden – toll gemacht!";

export function getMazeLevel(id: number): MazeLevelDef | undefined {
  return MAZE_LEVELS.find((level) => level.id === id);
}
