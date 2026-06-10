"use client";

import Link from "next/link";

interface PytoLabyrinthRewardProps {
  completedLevels: number[];
}

export default function PytoLabyrinthReward({ completedLevels }: PytoLabyrinthRewardProps) {
  const level1Done = completedLevels.includes(1);
  const level2Done = completedLevels.includes(2);
  const level3Done = completedLevels.includes(3);
  const level4Done = completedLevels.includes(4);

  return (
    <section className="maze-reward-card rounded-2xl border-2 border-primary/40 shadow-md mb-8 overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center">
        <div className="text-5xl shrink-0" aria-hidden>
          🤖
        </div>
        <div className="flex-1 text-center sm:text-left">
          <span className="badge badge-primary badge-lg mb-2">Belohnung · Version 0.9</span>
          <h2 className="text-2xl font-bold mb-2">Python Labyrinth Spiel</h2>
          <p className="opacity-85 mb-4">
            Du hast Lektion 2 geschafft – als Belohnung wartet das Python-Labyrinth-Spiel!
            Steuere Pyto mit Python-Code durch Nebel und Level. Je weniger du auf
            Ausführen klickst, desto besser dein Highscore.
          </p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-sm mb-4">
            <span className={`badge ${level1Done ? "badge-success" : "badge-outline"}`}>
              Level 1 {level1Done ? "✓" : "offen"}
            </span>
            <span
              className={`badge ${
                level2Done ? "badge-success" : level1Done ? "badge-outline" : "badge-ghost"
              }`}
            >
              Level 2 {level2Done ? "✓" : level1Done ? "freigeschaltet" : "🔒"}
            </span>
            <span
              className={`badge ${
                level3Done ? "badge-success" : level2Done ? "badge-outline" : "badge-ghost"
              }`}
            >
              Level 3 {level3Done ? "✓" : level2Done ? "freigeschaltet" : "🔒"}
            </span>
            <span
              className={`badge ${
                level4Done ? "badge-success" : level3Done ? "badge-outline" : "badge-ghost"
              }`}
            >
              Level 4 {level4Done ? "✓" : level3Done ? "freigeschaltet" : "🔒"}
            </span>
          </div>
          <Link href="/labyrinth" className="btn btn-primary btn-lg">
            Zum Python Labyrinth Spiel
          </Link>
        </div>
      </div>
    </section>
  );
}
