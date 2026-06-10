"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMazeHighscores } from "@/lib/maze/highscoreClient";
import { rankMazeHighscores } from "@/lib/maze/highscores";
import { getOrCreateVisitorId } from "@/lib/visitor";
import MazeConfetti from "./MazeConfetti";

interface MazeCelebrationProps {
  onContinue: () => void;
  levelId: number;
  executeCount: number;
  adminPreview?: boolean;
}

export default function MazeCelebration({
  onContinue,
  levelId,
  executeCount,
  adminPreview = false,
}: MazeCelebrationProps) {
  const [loading, setLoading] = useState(!adminPreview);
  const visitorId = useMemo(() => getOrCreateVisitorId(), []);

  const [ranked, setRanked] = useState<
    ReturnType<typeof rankMazeHighscores>
  >([]);

  useEffect(() => {
    if (adminPreview) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      const entries = await fetchMazeHighscores(levelId);
      if (cancelled) return;
      setRanked(rankMazeHighscores(entries, visitorId));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [adminPreview, levelId, visitorId]);

  return (
    <div className="maze-celebration">
      <MazeConfetti />
      <div className="maze-celebration__card">
        <p className="maze-celebration__title">Level geschafft!</p>
        <p className="maze-celebration__text">
          Pyto ist frei – danke für deine Hilfe beim Programmieren!
        </p>
        <p className="maze-celebration__text text-sm mt-2">
          Du hast <strong>{executeCount}×</strong> auf Ausführen geklickt.
          {executeCount === 1 && <> Alles in einem Programm – stark!</>}
        </p>

        <div className="maze-highscore mt-4 w-full text-left">
          <h3 className="maze-highscore__title">Highscore – Level {levelId}</h3>
          <p className="maze-highscore__hint text-xs opacity-70 mb-2">
            Weniger Ausführungen = besser · ganz oben steht der Spitzenreiter
          </p>

          {adminPreview ? (
            <p className="text-sm opacity-70">
              In der Admin-Vorschau wird kein Highscore gespeichert.
            </p>
          ) : loading ? (
            <p className="text-sm opacity-70">Highscore wird geladen …</p>
          ) : ranked.length === 0 ? (
            <p className="text-sm opacity-70">
              Du bist der Erste auf diesem Level – Glückwunsch!
            </p>
          ) : (
            <ol className="maze-highscore__list">
              {ranked.map((entry) => (
                <li
                  key={entry.visitorId}
                  className={`maze-highscore__row${
                    entry.isCurrentUser ? " maze-highscore__row--you" : ""
                  }`}
                >
                  <span className="maze-highscore__rank">{entry.rank}.</span>
                  <span className="maze-highscore__name">{entry.displayName}</span>
                  <span className="maze-highscore__score">
                    {entry.executeCount}×
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <button type="button" className="btn btn-primary mt-4" onClick={onContinue}>
          Weiter
        </button>
      </div>
    </div>
  );
}
