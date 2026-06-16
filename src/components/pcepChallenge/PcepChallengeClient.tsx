"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PytoMascot from "@/components/PytoMascot";
import RichContent from "@/components/RichContent";
import ProgressBar from "@/components/ProgressBar";
import {
  formatChallengeDuration,
  markPcepChallengeComplete,
  readPcepChallengeProgress,
} from "@/lib/pcepChallenge/progress";
import type { PcepChallengeQuestion } from "@/lib/pcepChallenge/types";
import { scheduleLearnerBoardSync } from "@/lib/learnerSync";

type Phase = "intro" | "quiz" | "result";

interface Props {
  questions: PcepChallengeQuestion[];
}

function formatLiveTimer(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
  }
  return `${seconds}.${tenths}s`;
}

export default function PcepChallengeClient({ questions }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [resultMs, setResultMs] = useState<number | null>(null);
  const [bestMs, setBestMs] = useState<number | null>(null);
  const startRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    const progress = readPcepChallengeProgress();
    setBestMs(progress.bestTimeMs);
  }, []);

  useEffect(() => {
    if (phase !== "quiz") {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }

    tickRef.current = setInterval(() => {
      if (startRef.current !== null) {
        setElapsedMs(Date.now() - startRef.current);
      }
    }, 100);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase]);

  const isCorrect = submitted && selectedIndex === currentQuestion?.correctIndex;

  const startChallenge = useCallback(() => {
    startRef.current = Date.now();
    setElapsedMs(0);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setPhase("quiz");
  }, []);

  const finishChallenge = useCallback((finalMs: number) => {
    const progress = markPcepChallengeComplete(finalMs);
    setResultMs(finalMs);
    setBestMs(progress.bestTimeMs);
    setPhase("result");
    scheduleLearnerBoardSync();
  }, []);

  const handleCheck = useCallback(() => {
    if (!currentQuestion || selectedIndex === null) return;
    setSubmitted(true);
    if (selectedIndex !== currentQuestion.correctIndex) return;

    const isLast = questionIndex + 1 >= questions.length;
    if (isLast) {
      const finalMs =
        startRef.current !== null ? Date.now() - startRef.current : elapsedMs;
      finishChallenge(finalMs);
      return;
    }

    setTimeout(() => {
      setQuestionIndex((i) => i + 1);
      setSelectedIndex(null);
      setSubmitted(false);
    }, 600);
  }, [
    currentQuestion,
    selectedIndex,
    questionIndex,
    questions.length,
    elapsedMs,
    finishChallenge,
  ]);

  const timerLabel = useMemo(
    () => formatLiveTimer(elapsedMs),
    [elapsedMs],
  );

  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <PytoMascot
          variant="erfolg"
          message="Du hast alle Lektionen geschafft! Jetzt kommt die **PCEP-Challenge**: 12 typische Prüfungsfragen – deine Zeit läuft ab dem ersten Klick. Viel Erfolg!"
          size="md"
        />
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body gap-4">
            <h2 className="card-title">So funktioniert&apos;s</h2>
            <ul className="list-disc list-inside space-y-2 text-sm opacity-90">
              <li>12 Multiple-Choice-Fragen wie im PCEP-Test</li>
              <li>Timer startet beim Start und stoppt nach der letzten richtigen Antwort</li>
              <li>Du musst jede Frage richtig beantworten, um weiterzukommen</li>
              <li>Deine beste Zeit wird gespeichert</li>
            </ul>
            {bestMs !== null && (
              <p className="text-sm text-primary font-medium">
                Deine beste Zeit bisher: {formatChallengeDuration(bestMs)}
              </p>
            )}
            <button type="button" className="btn btn-primary btn-lg" onClick={startChallenge}>
              Challenge starten
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result" && resultMs !== null) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-4">
        <PytoMascot
          variant="erfolg"
          message={`Geschafft! Alle 12 Fragen in **${formatChallengeDuration(resultMs)}** – stark! Damit bist du bestens auf die PCEP-Prüfung vorbereitet.`}
          size="lg"
        />
        <div className="card bg-base-100 border border-primary/40 shadow-xl">
          <div className="card-body items-center text-center gap-4">
            <span className="text-5xl" aria-hidden>
              🎓
            </span>
            <h2 className="text-2xl font-bold">PCEP-Challenge abgeschlossen!</h2>
            <p className="text-lg">
              Deine Zeit: <strong>{formatChallengeDuration(resultMs)}</strong>
            </p>
            {bestMs !== null && bestMs !== resultMs && (
              <p className="text-sm opacity-70">
                Beste Zeit: {formatChallengeDuration(bestMs)}
              </p>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <button type="button" className="btn btn-primary" onClick={startChallenge}>
                Nochmal versuchen
              </button>
              <Link href="/" className="btn btn-ghost">
                Zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="badge badge-primary">{currentQuestion.topic}</span>
          <p className="text-sm opacity-60 mt-1">
            Frage {questionIndex + 1} von {questions.length}
          </p>
        </div>
        <div className="challenge-timer font-mono text-2xl font-bold text-primary tabular-nums">
          ⏱ {timerLabel}
        </div>
      </div>

      <ProgressBar
        value={questionIndex + (submitted && isCorrect ? 1 : 0)}
        max={questions.length}
        label="Fortschritt"
      />

      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body gap-6">
          <RichContent content={currentQuestion.question} size="lg" className="font-medium" />

          <div className="flex flex-col gap-2">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedIndex === index;
              const showResult = submitted && isSelected;
              const isOptionCorrect = index === currentQuestion.correctIndex;

              let optionClass = "mc-option";
              if (!submitted) {
                if (isSelected) optionClass += " mc-option--selected";
              } else if (showResult) {
                optionClass += isOptionCorrect
                  ? " mc-option--correct"
                  : " mc-option--wrong";
              } else if (isOptionCorrect) {
                optionClass += " mc-option--correct-hint";
              } else {
                optionClass += " mc-option--dimmed";
              }

              return (
                <button
                  key={index}
                  type="button"
                  className={optionClass}
                  onClick={() => {
                    if (submitted && isCorrect) return;
                    setSelectedIndex(index);
                    setSubmitted(false);
                  }}
                >
                  <RichContent content={option} size="sm" />
                </button>
              );
            })}
          </div>

          {submitted && !isCorrect && (
            <p className="text-error text-sm">Nicht ganz – versuch es noch einmal.</p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedIndex === null || (submitted && isCorrect)}
              onClick={handleCheck}
            >
              {submitted && !isCorrect ? "Erneut prüfen" : "Antwort prüfen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
