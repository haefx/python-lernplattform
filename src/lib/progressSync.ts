import type { Exercise, Flashcard, LessonProgress } from "./types";

export function syncLessonCompletion(
  lp: LessonProgress,
  cards: Flashcard[],
  exercises: Exercise[],
) {
  const allCards = cards.every((c) => lp.completedCardIds.includes(c.id));
  const allExercises =
    exercises.length === 0 ||
    exercises.every((e) => lp.completedExerciseIds?.includes(e.id));

  if (allCards && allExercises) {
    if (!lp.lessonCompleted) {
      lp.lessonCompleted = true;
      lp.completedAt = new Date().toISOString();
    }
  } else {
    lp.lessonCompleted = false;
    delete lp.completedAt;
  }
}
