"use client";

import { useCallback, useEffect, useState } from "react";
import AchievementMedalsRow from "@/components/AchievementMedalsRow";
import type { LearnerBoardEntry } from "@/lib/learnerBoard";
import { PROGRESS_UPDATED_EVENT } from "@/lib/visitorProgress";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { scheduleLearnerBoardSync } from "@/lib/learnerSync";

export default function LearnerMonitor() {
  const [entries, setEntries] = useState<LearnerBoardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBoard = useCallback(async () => {
    try {
      const visitorId = getOrCreateVisitorId();
      const res = await fetch(`/api/learners?visitorId=${encodeURIComponent(visitorId)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { entries?: LearnerBoardEntry[] };
      setEntries(data.entries ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scheduleLearnerBoardSync();
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    const refresh = () => {
      scheduleLearnerBoardSync();
      void loadBoard();
    };
    window.addEventListener(PROGRESS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_UPDATED_EVENT, refresh);
  }, [loadBoard]);

  if (loading) {
    return (
      <section className="learner-monitor rounded-2xl border-2 border-base-300 bg-base-200/40 p-5 mb-8">
        <div className="flex items-center gap-3 text-sm opacity-70">
          <span className="loading loading-spinner loading-sm" />
          Lernmonitor wird geladen…
        </div>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="learner-monitor rounded-2xl border-2 border-base-300 bg-base-200/40 p-5 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60 mb-2">
          Lernmonitor
        </h2>
        <p className="text-sm opacity-70">
          Noch keine Lernenden im Monitor – dein Fortschritt erscheint hier, sobald du
          loslegst.
        </p>
      </section>
    );
  }

  return (
    <section className="learner-monitor rounded-2xl border-2 border-base-300 bg-base-200/40 p-5 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-60">
          Lernmonitor
        </h2>
        <span className="badge badge-outline badge-sm">
          {entries.length} {entries.length === 1 ? "Person" : "Personen"}
        </span>
      </div>

      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={`flex items-start gap-3 rounded-xl px-3 py-2 text-sm ${
              entry.isCurrentUser
                ? "bg-primary/10 border border-primary/20"
                : "bg-base-100/70"
            }`}
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                entry.percentComplete >= 100 ? "bg-success" : "bg-warning"
              }`}
              aria-hidden
            />
            <span>
              <AchievementMedalsRow
                lessonMedals={entry.lessonMedals}
                mazeMedals={entry.mazeMedals}
              />
              <strong>{entry.displayName}</strong>
              {entry.isCurrentUser && (
                <span className="ml-2 text-xs opacity-60">(du)</span>
              )}
              {" – "}
              Lektion {entry.lessonNumber} Fragen + Übungen{" "}
              <strong>{entry.percentComplete}%</strong> abgeschlossen
              {entry.completionCount > 0 && (
                <>
                  {" · "}
                  {entry.completionCount > 1 ? (
                    <strong>{entry.completionCount - 1}× wiederholt</strong>
                  ) : (
                    <span>1× abgeschlossen</span>
                  )}
                  {entry.isRepeating && (
                    <>
                      {" "}
                      <span className="opacity-75">
                        (aktuell {entry.currentRunPercent}%)
                      </span>
                    </>
                  )}
                </>
              )}
              .
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
