"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { enrichLessonAccess } from "@/lib/lessonAccess";
import { getPytoForHome } from "@/lib/pyto";
import {
  clearAllVisitorData,
  getAnnouncedLessonIds,
  getVisitorState,
  markLessonsAnnounced,
  markVisitorReturning,
  setVisitorOnboarded,
} from "@/lib/visitor";
import {
  computeProgressTotals,
  enrichLessonsWithProgress,
  getLessonProgressList,
  PROGRESS_UPDATED_EVENT,
  type LessonWithCardCount,
} from "@/lib/visitorProgress";
import { scheduleLearnerBoardSync } from "@/lib/learnerSync";
import { applyServerProgressResetIfNeeded } from "@/lib/progressReset";
import { isLabyrinthUnlocked, readMazeProgress } from "@/lib/maze/progress";
import LessonCard from "./LessonCard";
import LearnerMonitor from "./LearnerMonitor";
import ProgressBar from "./ProgressBar";
import PytoLabyrinthReward from "./PytoLabyrinthReward";
import PytoMascot from "./PytoMascot";

interface HomeClientProps {
  lessons: LessonWithCardCount[];
}

function clearLocalCodeStorage() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("pcep-code-")) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export default function HomeClient({ lessons: baseLessons }: HomeClientProps) {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [totalCards, setTotalCards] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [lessonsDone, setLessonsDone] = useState(0);
  const [lessons, setLessons] = useState(
    enrichLessonAccess(
      enrichLessonsWithProgress(baseLessons),
      getLessonProgressList(),
    ),
  );
  const [newlyAvailableLesson, setNewlyAvailableLesson] = useState<{
    id: string;
    title: string;
    lessonNumber: number;
  } | null>(null);
  const [labyrinthUnlocked, setLabyrinthUnlocked] = useState(false);
  const [mazeCompletedLevels, setMazeCompletedLevels] = useState<number[]>([]);

  const refreshProgress = useCallback(() => {
    const progress = getLessonProgressList();
    const enriched = enrichLessonsWithProgress(baseLessons);
    const withAccess = enrichLessonAccess(enriched, progress);
    const totals = computeProgressTotals(enriched);
    const announced = getAnnouncedLessonIds();

    const silentAnnounceIds = withAccess
      .filter(
        (lesson) =>
          lesson.lessonNumber === 1 &&
          lesson.published &&
          !announced.includes(lesson.id),
      )
      .map((lesson) => lesson.id);
    if (silentAnnounceIds.length > 0) {
      markLessonsAnnounced(silentAnnounceIds);
    }

    const announcedAfterSilent = getAnnouncedLessonIds();
    const newlyAvailable =
      withAccess.find(
        (lesson) =>
          lesson.accessState === "available" &&
          lesson.lessonNumber > 1 &&
          !announcedAfterSilent.includes(lesson.id),
      ) ?? null;

    setLessons(withAccess);
    setTotalCards(totals.totalCards);
    setTotalCompleted(totals.totalCompleted);
    setLessonsDone(totals.lessonsDone);
    setLabyrinthUnlocked(isLabyrinthUnlocked(progress));
    setMazeCompletedLevels(readMazeProgress().completedLevels);
    setNewlyAvailableLesson(
      newlyAvailable
        ? {
            id: newlyAvailable.id,
            title: newlyAvailable.title,
            lessonNumber: newlyAvailable.lessonNumber,
          }
        : null,
    );
  }, [baseLessons]);

  useEffect(() => {
    if (!newlyAvailableLesson) return;
    markLessonsAnnounced([newlyAvailableLesson.id]);
  }, [newlyAvailableLesson]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const wasReset = await applyServerProgressResetIfNeeded();
      if (cancelled) return;

      const visitor = getVisitorState();
      setName(visitor.name);
      setOnboarded(visitor.onboarded);
      setIsReturning(visitor.returning);
      refreshProgress();
      if (wasReset) scheduleLearnerBoardSync();
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshProgress]);

  useEffect(() => {
    if (!hydrated || !onboarded) return;
    markVisitorReturning();
    scheduleLearnerBoardSync();
  }, [hydrated, onboarded]);

  useEffect(() => {
    if (!hydrated) return;
    refreshProgress();
  }, [pathname, hydrated, refreshProgress]);

  useEffect(() => {
    if (!hydrated) return;
    const onUpdate = () => refreshProgress();
    window.addEventListener(PROGRESS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(PROGRESS_UPDATED_EVENT, onUpdate);
  }, [hydrated, refreshProgress]);

  const pyto = getPytoForHome(
    onboarded,
    totalCompleted,
    totalCards,
    lessons,
    newlyAvailableLesson,
  );

  function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("Bitte gib deinen Namen ein.");
      return;
    }
    setVisitorOnboarded(trimmed);
    setName(trimmed);
    setOnboarded(true);
    setIsReturning(false);
    setError("");
    scheduleLearnerBoardSync();
    refreshProgress();
  }

  function handleReset() {
    if (
      !confirm(
        "Willkommensbildschirm erneut anzeigen? Name, Lernfortschritt und gespeicherter Übungscode werden auf diesem Gerät gelöscht."
      )
    ) {
      return;
    }
    clearAllVisitorData();
    clearLocalCodeStorage();
    setName("");
    setNameInput("");
    setOnboarded(false);
    setIsReturning(false);
    refreshProgress();
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!onboarded) {
    return (
      <div className="welcome-screen min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
        <div className="welcome-card w-full max-w-2xl">
          <div className="text-center mb-8">
            <span className="badge badge-primary badge-lg mb-4">PCEP Lernplattform</span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Willkommen, WBS-Student!</h1>
          </div>

          <PytoMascot
            key="welcome"
            variant={pyto.variant}
            message={pyto.message}
            size="lg"
            className="mb-8"
          />

          <div className="welcome-panel rounded-2xl p-6 sm:p-8 border-2">
            <p className="text-base sm:text-lg leading-relaxed text-center mb-8 opacity-90">
              Mithilfe meiner Lernkarten hast Du die Möglichkeit, für das Zertifikat zu üben
              und zu lernen. Viel Spaß und Erfolg!
            </p>

            <form onSubmit={handleNameSubmit} className="flex flex-col gap-4 max-w-sm mx-auto">
              <label className="form-control w-full">
                <span className="label-text font-medium mb-2">Wie heißt du?</span>
                <input
                  type="text"
                  className="input input-bordered input-lg w-full"
                  placeholder="Dein Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={40}
                  autoFocus
                  required
                />
              </label>
              {error && <p className="text-error text-sm text-center">{error}</p>}
              <button type="submit" className="btn btn-primary btn-lg">
                Los geht&apos;s!
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const totalCatalogLessons = baseLessons.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <section className="dashboard-hero rounded-2xl shadow-md border-2 border-base-300 mb-8 overflow-hidden">
        <div className="p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {isReturning ? "Willkommen zurück" : "Willkommen"}, {name}!
          </h1>
          <p className="text-lg opacity-80 mb-6">
            Du hast bereits <strong>{totalCompleted}</strong>{" "}
            {totalCompleted === 1 ? "Karte" : "Karten"} geschafft. Bleib am Ball und
            mache jetzt weiter.
          </p>

          <PytoMascot
            key={`dashboard-${totalCompleted}-${newlyAvailableLesson?.id ?? "none"}`}
            variant={pyto.variant}
            message={pyto.message}
            size="md"
            className="mb-6"
          />

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="badge badge-primary badge-lg">PCEP Vorbereitung</span>
            <span className="badge badge-outline badge-lg">
              {lessonsDone}/{totalCatalogLessons} Lektionen abgeschlossen
            </span>
          </div>

          <ProgressBar
            value={totalCompleted}
            max={totalCards}
            label="Dein Lernfortschritt (alle Lektionen)"
          />
        </div>
      </section>

      <LearnerMonitor />

      {labyrinthUnlocked && (
        <PytoLabyrinthReward completedLevels={mazeCompletedLevels} />
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold">Lektionen</h2>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleReset}
          >
            Willkommen erneut anzeigen
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="alert alert-info">
            <span>Noch keine Lektionen angelegt.</span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
