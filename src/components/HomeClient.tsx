"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { LessonWithStats } from "@/lib/types";
import { getPytoForHome } from "@/lib/pyto";
import {
  clearAllVisitorData,
  getVisitorState,
  setVisitorOnboarded,
} from "@/lib/visitor";
import {
  computeProgressTotals,
  enrichLessonsWithProgress,
  PROGRESS_UPDATED_EVENT,
  type LessonWithCardCount,
} from "@/lib/visitorProgress";
import LessonCard from "./LessonCard";
import ProgressBar from "./ProgressBar";
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
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [lessons, setLessons] = useState<LessonWithStats[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [lessonsDone, setLessonsDone] = useState(0);

  const refreshProgress = useCallback(() => {
    const enriched = enrichLessonsWithProgress(baseLessons);
    const totals = computeProgressTotals(enriched);
    setLessons(enriched);
    setTotalCards(totals.totalCards);
    setTotalCompleted(totals.totalCompleted);
    setLessonsDone(totals.lessonsDone);
  }, [baseLessons]);

  useEffect(() => {
    const visitor = getVisitorState();
    setName(visitor.name);
    setOnboarded(visitor.onboarded);
    refreshProgress();
    setHydrated(true);
  }, [refreshProgress]);

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

  const pyto = getPytoForHome(onboarded, totalCompleted, totalCards);

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
    setError("");
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <section className="dashboard-hero rounded-2xl shadow-md border-2 border-base-300 mb-8 overflow-hidden">
        <div className="p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Willkommen zurück, {name}!
          </h1>
          <p className="text-lg opacity-80 mb-6">
            Du hast bereits <strong>{totalCompleted}</strong>{" "}
            {totalCompleted === 1 ? "Karte" : "Karten"} geschafft. Bleib am Ball und
            mache jetzt weiter.
          </p>

          <PytoMascot
            key={`dashboard-${totalCompleted}`}
            variant={pyto.variant}
            message={pyto.message}
            size="md"
            className="mb-6"
          />

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="badge badge-primary badge-lg">PCEP Vorbereitung</span>
            <span className="badge badge-outline badge-lg">
              {lessonsDone}/{lessons.length} Lektionen abgeschlossen
            </span>
          </div>

          <ProgressBar
            value={totalCompleted}
            max={totalCards}
            label="Dein Lernfortschritt"
          />
        </div>
      </section>

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
            <span>Noch keine Lektionen freigegeben.</span>
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
