import { hasEverCompletedLesson } from "./lessonCompletion";
import type { LessonMeta } from "./learnerBoard";
import type { LessonProgress } from "./types";

/** Lektions-Orden: 1 = ein Stern, 2 = zwei Sterne, 3 = drei Sterne */
export function getLessonMedalIcon(lessonNumber: number): string {
  if (lessonNumber === 3) return "★★★";
  if (lessonNumber === 2) return "★★";
  return "★";
}

/** Labyrinth-Orden nach Level */
export function getMazeMedalIcon(levelId: number): string {
  switch (levelId) {
    case 1:
      return "🤖";
    case 2:
      return "⭐";
    case 3:
      return "🐍";
    case 4:
      return "🐛";
    default:
      return "🏅";
  }
}

export function getLessonMedalTitle(lessonNumber: number): string {
  return `Lektion ${lessonNumber} abgeschlossen`;
}

export function getMazeMedalTitle(levelId: number): string {
  return `Labyrinth Level ${levelId} abgeschlossen`;
}

export function getCompletedLessonNumbers(
  lessonProgress: LessonProgress[],
  lessons: LessonMeta[],
): number[] {
  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  return sorted
    .map((lesson, index) => {
      const lp = lessonProgress.find((p) => p.lessonId === lesson.id);
      if (!hasEverCompletedLesson(lp)) return null;
      return index + 1;
    })
    .filter((n): n is number => n !== null);
}

export function normalizeMazeCompletedLevels(levels: number[] | undefined): number[] {
  if (!levels?.length) return [];
  return [...new Set(levels.filter((id) => id >= 1 && id <= 4))].sort((a, b) => a - b);
}
