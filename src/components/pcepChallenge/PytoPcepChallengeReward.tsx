"use client";

import Link from "next/link";
import AchievementBadge from "@/components/AchievementBadge";
import {
  formatChallengeDuration,
  readPcepChallengeProgress,
} from "@/lib/pcepChallenge/progress";
import { getPcepChallengeMedalIcon, getPcepChallengeMedalTitle } from "@/lib/achievements";
import { PCEP_CHALLENGE_PROGRESS_EVENT } from "@/lib/pcepChallenge/progress";
import { useEffect, useState } from "react";

export default function PytoPcepChallengeReward() {
  const [completed, setCompleted] = useState(false);
  const [bestMs, setBestMs] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      const p = readPcepChallengeProgress();
      setCompleted(p.completed);
      setBestMs(p.bestTimeMs);
    };
    refresh();
    window.addEventListener(PCEP_CHALLENGE_PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PCEP_CHALLENGE_PROGRESS_EVENT, refresh);
  }, []);

  return (
    <section className="rounded-2xl border-2 border-secondary/50 bg-base-100 shadow-md mb-8 overflow-hidden">
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center">
        <div className="text-5xl shrink-0" aria-hidden>
          🎓
        </div>
        <div className="flex-1 text-center sm:text-left">
          <span className="badge badge-secondary badge-lg mb-2">Finale Challenge</span>
          <h2 className="text-2xl font-bold mb-2">PCEP-Prüfungs-Challenge</h2>
          <p className="opacity-85 mb-4">
            Du hast alle Lektionen gemeistert! Jetzt warten 12 typische Fang-Fragen
            wie im PCEP-Test – deine Zeit wird gemessen. Wie schnell schaffst du
            alle Antworten?
          </p>

          {completed && bestMs !== null && (
            <div className="flex flex-wrap items-center gap-2 mb-4 justify-center sm:justify-start">
              <AchievementBadge
                icon={getPcepChallengeMedalIcon()}
                title={getPcepChallengeMedalTitle()}
                size="sm"
              />
              <span className="badge badge-success">
                Beste Zeit: {formatChallengeDuration(bestMs)}
              </span>
            </div>
          )}

          <Link href="/pcep-challenge" className="btn btn-secondary btn-lg">
            {completed ? "Challenge wiederholen" : "Zur PCEP-Challenge"}
          </Link>
        </div>
      </div>
    </section>
  );
}
