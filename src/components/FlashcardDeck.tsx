"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Exercise, Flashcard } from "@/lib/types";
import {
  CARDS_PER_BLOCK,
  getExerciseIndexAfterCard,
  getInitialLessonState,
} from "@/lib/lessonFlow";
import {
  restartLessonProgress,
  getLessonProgress,
  markCardComplete,
  toggleExerciseComplete,
} from "@/lib/visitorProgress";
import { isMultipleChoiceCard } from "@/lib/cardFormat";
import ExerciseGate from "./ExerciseGate";
import FlipCard from "./FlipCard";
import MultipleChoiceCard from "./MultipleChoiceCard";
import LessonCompleteModal from "./LessonCompleteModal";
import LessonPyto from "./LessonPyto";
import PytoStickyAside from "./PytoStickyAside";
import PytoTipBuddy, { type PytoAnswerFeedback } from "./PytoTipBuddy";
import ProgressBar from "./ProgressBar";

interface FlashcardDeckProps {
  lessonId: string;
  lessonTitle: string;
  lessonNumber: number;
  totalLessons: number;
  nextLesson?: { title: string; published: boolean };
  cards: Flashcard[];
  exercises: Exercise[];
}

type ViewMode = "card" | "exercise" | "done";

export default function FlashcardDeck({
  lessonId,
  lessonTitle,
  lessonNumber,
  totalLessons,
  nextLesson,
  cards,
  exercises,
}: FlashcardDeckProps) {
  const [ready, setReady] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [mode, setMode] = useState<ViewMode>("card");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(
    null,
  );
  const [flipped, setFlipped] = useState(false);
  const [hasViewedBack, setHasViewedBack] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [pytoAnswerFeedback, setPytoAnswerFeedback] =
    useState<PytoAnswerFeedback>(null);

  useEffect(() => {
    setPytoAnswerFeedback(null);
  }, [currentIndex, mode, activeExerciseIndex]);

  useEffect(() => {
    const lp = getLessonProgress(lessonId);
    const initial = getInitialLessonState(
      cards,
      exercises,
      lp?.completedCardIds ?? [],
      lp?.completedExerciseIds ?? [],
      lp?.lessonCompleted ?? false,
    );

    setCompletedIds(lp?.completedCardIds ?? []);
    setCompletedExerciseIds(lp?.completedExerciseIds ?? []);
    setMode(initial.mode);
    setCurrentIndex(initial.cardIndex);
    setActiveExerciseIndex(initial.exerciseIndex);
    setReady(true);
  }, [lessonId, cards, exercises]);

  const currentCard = cards[currentIndex];
  const currentExercise =
    activeExerciseIndex !== null ? exercises[activeExerciseIndex] : null;
  const isMcCard = currentCard ? isMultipleChoiceCard(currentCard) : false;
  const canProceed = hasViewedBack;

  const saveCardProgress = useCallback(
    (cardId: string) => {
      const lp = markCardComplete(lessonId, cardId, cards, exercises);
      setCompletedIds(lp.completedCardIds);
    },
    [lessonId, cards, exercises],
  );

  const handleToggleExerciseComplete = useCallback(() => {
    if (!currentExercise) return;
    setSavingExercise(true);
    const ids = toggleExerciseComplete(
      lessonId,
      currentExercise.id,
      cards,
      exercises,
    );
    setCompletedExerciseIds(ids);
    setSavingExercise(false);
  }, [lessonId, currentExercise, cards, exercises]);

  const handleFlip = useCallback(() => {
    setFlipped((prev) => {
      if (!prev) setHasViewedBack(true);
      return !prev;
    });
  }, []);

  const finishLesson = useCallback(() => {
    setMode("done");
    setCelebrationOpen(true);
  }, []);

  const continueFromExercise = useCallback(() => {
    if (activeExerciseIndex === null) return;

    const nextCardIndex = (activeExerciseIndex + 1) * CARDS_PER_BLOCK;
    if (nextCardIndex >= cards.length) {
      finishLesson();
      return;
    }

    setCurrentIndex(nextCardIndex);
    setMode("card");
    setActiveExerciseIndex(null);
    setFlipped(false);
    setHasViewedBack(false);
  }, [activeExerciseIndex, cards.length, finishLesson]);

  const goNextCard = useCallback(() => {
    if (!currentCard) return;

    if (!completedIds.includes(currentCard.id)) {
      saveCardProgress(currentCard.id);
    }

    const exerciseIdx = getExerciseIndexAfterCard(currentIndex);
    if (exerciseIdx !== null && exercises[exerciseIdx]) {
      setActiveExerciseIndex(exerciseIdx);
      setMode("exercise");
      setFlipped(false);
      setHasViewedBack(false);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= cards.length) {
      finishLesson();
      return;
    }

    setCurrentIndex(nextIndex);
    setFlipped(false);
    setHasViewedBack(false);
  }, [
    currentCard,
    completedIds,
    currentIndex,
    cards.length,
    exercises,
    saveCardProgress,
    finishLesson,
  ]);

  const goPrevCard = useCallback(() => {
    if (currentIndex === 0) return;

    if (currentIndex % CARDS_PER_BLOCK === 0) {
      const exerciseIdx = currentIndex / CARDS_PER_BLOCK - 1;
      if (exercises[exerciseIdx]) {
        setActiveExerciseIndex(exerciseIdx);
        setMode("exercise");
        setFlipped(false);
        setHasViewedBack(false);
        return;
      }
    }

    setCurrentIndex(currentIndex - 1);
    setFlipped(false);
    setHasViewedBack(false);
  }, [currentIndex, exercises]);

  const restartLesson = useCallback(() => {
    restartLessonProgress(lessonId);
    const reset = getInitialLessonState(cards, exercises, [], [], false);
    setCompletedIds([]);
    setCompletedExerciseIds([]);
    setMode(reset.mode === "done" ? "card" : reset.mode);
    setCurrentIndex(0);
    setActiveExerciseIndex(null);
    setFlipped(false);
    setHasViewedBack(false);
    setCelebrationOpen(false);
  }, [lessonId, cards, exercises]);

  const completedCount = useMemo(
    () => cards.filter((c) => completedIds.includes(c.id)).length,
    [cards, completedIds],
  );

  const exerciseCompletedCount = useMemo(
    () => exercises.filter((e) => completedExerciseIds.includes(e.id)).length,
    [exercises, completedExerciseIds],
  );

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="alert alert-info">
        <span>Noch keine Lernkarten in dieser Lektion.</span>
      </div>
    );
  }

  const pytoSection = (
    <LessonPyto
      completedCards={completedCount}
      totalCards={cards.length}
      onExercise={mode === "exercise"}
      lessonComplete={mode === "done"}
      lessonNumber={lessonNumber}
      totalLessons={totalLessons}
      nextLesson={nextLesson}
    />
  );

  if (mode === "done") {
    return (
      <>
        <LessonCompleteModal
          open={celebrationOpen}
          lessonNumber={lessonNumber}
          lessonTitle={lessonTitle}
          onClose={() => setCelebrationOpen(false)}
        />
        <div className="flex flex-col gap-6 py-8">
        {pytoSection}
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-center">
            {lessonTitle} abgeschlossen!
          </h2>
          <p className="text-center opacity-70 max-w-md">
            Du hast alle {cards.length} Lernkarten und {exercises.length}{" "}
            Übungen durchgearbeitet.
          </p>
          <ProgressBar value={cards.length} max={cards.length} label="Lernkarten" />
          <ProgressBar
            value={exerciseCompletedCount}
            max={exercises.length}
            label="Übungen"
          />
          <div className="flex gap-3">
            <button type="button" className="btn btn-primary" onClick={restartLesson}>
              Von vorne wiederholen
            </button>
            <a href="/" className="btn btn-ghost">
              Zur Übersicht
            </a>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (mode === "exercise" && currentExercise && activeExerciseIndex !== null) {
    const isExerciseDone = completedExerciseIds.includes(currentExercise.id);
    const isGapFillExercise =
      currentExercise.exerciseType === "gap_fill" || Boolean(currentExercise.gapFill);

    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
        <ProgressBar
          value={completedCount}
          max={cards.length}
          label={`${completedCount} von ${cards.length} Fragen · Übung ${activeExerciseIndex + 1} von ${exercises.length}`}
        />

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <ExerciseGate
              exercise={currentExercise}
              index={activeExerciseIndex}
              isCompleted={isExerciseDone}
              saving={savingExercise}
              onToggleComplete={handleToggleExerciseComplete}
            />

            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={continueFromExercise}
                disabled={!isExerciseDone}
                title={
                  isExerciseDone
                    ? undefined
                    : isGapFillExercise
                      ? "Prüfe die Übung erfolgreich, um fortzufahren"
                      : "Hake die Übung ab, um mit den nächsten Fragen fortzufahren"
                }
              >
                {activeExerciseIndex + 1 >= exercises.length &&
                (activeExerciseIndex + 1) * CARDS_PER_BLOCK >= cards.length
                  ? "Lektion abschließen"
                  : "Weiter zu den nächsten Fragen"}
              </button>
            </div>
          </div>

          {!isGapFillExercise && (
            <PytoStickyAside>
              {pytoSection}
            </PytoStickyAside>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <ProgressBar
        value={completedCount}
        max={cards.length}
        label={`Frage ${currentIndex + 1} von ${cards.length}`}
      />

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0">
          {isMcCard ? (
            <MultipleChoiceCard
              key={currentCard.id}
              card={currentCard}
              onAnsweredCorrectly={() => setHasViewedBack(true)}
              onAnswerFeedbackChange={setPytoAnswerFeedback}
            />
          ) : (
            <FlipCard
              key={currentCard.id}
              card={currentCard}
              flipped={flipped}
              onFlip={handleFlip}
            />
          )}
        </div>
        <PytoStickyAside>
          <PytoTipBuddy
            key={currentCard.id}
            card={currentCard}
            disabled={!isMcCard && !hasViewedBack}
            answerFeedback={isMcCard ? pytoAnswerFeedback : null}
            solutionViewed={!isMcCard && hasViewedBack}
          />
        </PytoStickyAside>
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={goPrevCard}
          disabled={currentIndex === 0}
        >
          Zurück
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={goNextCard}
          disabled={!canProceed}
          title={
            canProceed
              ? undefined
              : isMcCard
                ? "Beantworte die Frage richtig, um fortzufahren"
                : "Drehe die Karte mit der Glühbirne um, um fortzufahren"
          }
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
