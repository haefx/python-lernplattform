"use client";

import { getPytoForLesson, getPytoForLessonComplete } from "@/lib/pyto";
import PytoMascot from "./PytoMascot";

interface LessonPytoProps {
  completedCards: number;
  totalCards: number;
  onExercise?: boolean;
  lessonComplete?: boolean;
  lessonNumber?: number;
  totalLessons?: number;
  nextLesson?: { title: string; published: boolean };
}

export default function LessonPyto({
  completedCards,
  totalCards,
  onExercise = false,
  lessonComplete = false,
  lessonNumber = 1,
  totalLessons = 1,
  nextLesson,
}: LessonPytoProps) {
  const pyto = lessonComplete
    ? getPytoForLessonComplete(lessonNumber, totalLessons, nextLesson)
    : getPytoForLesson(completedCards, totalCards, onExercise);

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-base-100 border border-base-300 shadow-sm">
      <PytoMascot
        key={pyto.message}
        variant={pyto.variant}
        message={pyto.message}
        size="sm"
      />
    </div>
  );
}
