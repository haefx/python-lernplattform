"use client";

import Link from "next/link";
import AchievementBadge from "@/components/AchievementBadge";
import { getMazeMedalIcon, getMazeMedalTitle } from "@/lib/achievements";

interface PytoLabyrinthRewardProps {
  completedLevels: number[];
}

function levelStatusBadge(levelId: number, completedLevels: number[]) {
  const done = completedLevels.includes(levelId);
  if (done) return { className: "badge-success", text: "✓" };

  if (levelId === 1) return { className: "badge-outline", text: "offen" };
  const prevDone = completedLevels.includes(levelId - 1);
  if (prevDone) return { className: "badge-outline", text: "freigeschaltet" };
  return { className: "badge-ghost", text: "🔒" };
}

export default function PytoLabyrinthReward({ completedLevels }: PytoLabyrinthRewardProps) {
  return (
    <section className="maze-reward-card rounded-2xl border-2 border-primary/40 shadow-md mb-8 overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center">
        <div className="text-5xl shrink-0" aria-hidden>
          🤖
        </div>
        <div className="flex-1 text-center sm:text-left">
          <span className="badge badge-primary badge-lg mb-2">Belohnung · Version 0.95</span>
          <h2 className="text-2xl font-bold mb-2">Python Labyrinth Spiel</h2>
          <p className="opacity-85 mb-4">
            Du hast Lektion 2 geschafft – als Belohnung wartet das Python-Labyrinth-Spiel!
            Steuere Pyto mit Python-Code durch Nebel und Level. Je weniger du auf
            Ausführen klickst, desto besser dein Highscore.
          </p>

          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start text-sm mb-4">
            {[1, 2, 3, 4].map((levelId) => {
              const done = completedLevels.includes(levelId);
              const status = levelStatusBadge(levelId, completedLevels);
              return (
                <span key={levelId} className="inline-flex items-center gap-1">
                  {done && (
                    <AchievementBadge
                      icon={getMazeMedalIcon(levelId)}
                      title={getMazeMedalTitle(levelId)}
                      size="sm"
                    />
                  )}
                  <span className={`badge ${status.className}`}>
                    Level {levelId} {status.text}
                  </span>
                </span>
              );
            })}
            <span className="badge badge-ghost opacity-60">Level 5 · Coming Soon</span>
          </div>

          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Link href="/labyrinth" className="btn btn-primary btn-lg">
              Zum Python Labyrinth Spiel
            </Link>
            <button type="button" className="btn btn-lg btn-outline btn-disabled" disabled>
              Level 5 · Coming Soon
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
