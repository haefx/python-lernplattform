"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/types";
import dynamic from "next/dynamic";
import CodeBlock from "./CodeBlock";
import RichContent from "./RichContent";

const PythonPlayground = dynamic(() => import("./PythonPlayground"), {
  ssr: false,
  loading: () => (
    <div className="alert alert-info py-2 text-sm">
      <span className="loading loading-spinner loading-sm" />
      Code-Editor wird geladen…
    </div>
  ),
});

interface ExerciseGateProps {
  exercise: Exercise;
  index: number;
  isCompleted: boolean;
  saving: boolean;
  onToggleComplete: () => void;
}

export default function ExerciseGate({
  exercise,
  index,
  isCompleted,
  saving,
  onToggleComplete,
}: ExerciseGateProps) {
  const [solutionVisible, setSolutionVisible] = useState(false);

  return (
    <div className="card bg-base-100 shadow-xl border-2 border-secondary">
      <div className="card-body gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-secondary">Übung {index + 1}</span>
          <span className="badge badge-outline">Pause nach 6 Fragen</span>
          {isCompleted && <span className="badge badge-success">Erledigt</span>}
        </div>

        <h2 className="card-title text-xl">{exercise.title}</h2>
        <RichContent content={exercise.task} size="sm" />

        <PythonPlayground
          exerciseId={exercise.id}
          initialCode={
            exercise.starterCode ??
            "# Schreibe deinen Code hier\nprint('Hallo Python!')"
          }
        />

        <div className="flex flex-wrap items-center gap-4 border-t border-base-300 pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-success checkbox-lg"
              checked={isCompleted}
              disabled={saving}
              onChange={onToggleComplete}
            />
            <span className="font-medium">
              Übung erledigt – zum Weiterlernen abhaken
            </span>
          </label>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm btn-primary w-fit"
          onClick={() => setSolutionVisible((v) => !v)}
        >
          {solutionVisible ? "Lösung ausblenden" : "Lösung anzeigen"}
        </button>

        {solutionVisible && (
          <div className="bg-base-200 rounded-lg p-4 border border-base-300">
            <p className="text-xs font-semibold uppercase opacity-60 mb-2">
              Lösung & Hinweise
            </p>
            <RichContent content={exercise.solution} size="sm" />
            {exercise.notes && (
              <div className="alert alert-warning mt-3 py-2 text-sm">
                <RichContent content={exercise.notes} size="sm" />
              </div>
            )}
            {exercise.solutionCode && (
              <CodeBlock code={exercise.solutionCode} label="Musterlösung" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
