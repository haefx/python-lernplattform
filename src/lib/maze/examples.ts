export interface MazeCodeExample {
  title: string;
  description: string;
  code: string;
}

export const MAZE_CODE_EXAMPLES: MazeCodeExample[] = [
  {
    title: "Ein Schritt",
    description: "Pyto geht ein Feld in Blickrichtung.",
    code: "vorwaerts()",
  },
  {
    title: "Mehrere Schritte",
    description: "Direkt mehrere Felder vorwärts.",
    code: "vorwaerts(3)",
  },
  {
    title: "Drehen",
    description: "90° nach links oder rechts drehen – auch mehrfach: rechts(2).",
    code: "rechts(2)",
  },
  {
    title: "Rückwärts",
    description: "Ein Feld rückwärts (ohne Umdrehen).",
    code: "rueckwaerts()",
  },
  {
    title: "Seitwärts",
    description: "Seitlich ausweichen, Blickrichtung bleibt.",
    code: "seitwaerts_links()",
  },
  {
    title: "Kleine Sequenz",
    description: "Mehrere Befehle in einer Zeile (mit Semikolon).",
    code: "links(); vorwaerts(2); rechts()",
  },
  {
    title: "Schleife",
    description: "Mit einer for-Schleife wiederholen.",
    code: "for schritt in range(4):\n    vorwaerts()",
  },
  {
    title: "Hebel halten",
    description: "1 Sekunde am Hebel halten (auf dem Hebel stehen!).",
    code: "halten()",
  },
  {
    title: "Hebel 5 Sekunden",
    description: "Schleife mit 5× halten() – öffnet das Tor.",
    code: "for i in range(5):\n    halten()",
  },
  {
    title: "Aufladen",
    description: "1 Sekunde an der Ladestation (darauf stehen!).",
    code: "aufladen()",
  },
  {
    title: "Laser laden",
    description: "5× aufladen() – danach kann laser() feuern.",
    code: "for i in range(5):\n    aufladen()",
  },
  {
    title: "Laser feuern",
    description: "1 Sekunde auf die Mauer in Blickrichtung schießen.",
    code: "laser()",
  },
  {
    title: "Mauer sprengen",
    description: "Direkt vor die Mauer stellen, 3× laser() – brüchige Mauer zerstören.",
    code: "for i in range(3):\n    laser()",
  },
  {
    title: "Bug fangen",
    description: "Auf dasselbe Feld wie der Bug stellen und fangen() aufrufen.",
    code: "fangen()",
  },
];
