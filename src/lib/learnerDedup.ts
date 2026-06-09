import { getCompletionCount } from "./lessonCompletion";
import type { LessonProgress } from "./types";
import type { LearnerBoardEntry, StoredLearner } from "./learnerBoard";

export function normalizeLearnerName(name: string): string {
  return name.trim().toLowerCase();
}

/** Fortschritts-Score zum Vergleichen von Lernmonitor-Einträgen. */
export function learnerProgressScore(lessonProgress: LessonProgress[]): number {
  return lessonProgress.reduce((sum, lp) => {
    const cards = lp.completedCardIds?.length ?? 0;
    const exercises = lp.completedExerciseIds?.length ?? 0;
    const completions = getCompletionCount(lp);
    return sum + cards + exercises + completions * 10_000;
  }, 0);
}

export function isStaleLearnerDuplicate(
  other: StoredLearner,
  currentId: string,
  currentName: string,
  currentProgress: LessonProgress[],
): boolean {
  if (other.id === currentId) return false;

  if (normalizeLearnerName(other.displayName) !== normalizeLearnerName(currentName)) {
    return false;
  }

  const otherScore = learnerProgressScore(other.lessonProgress);
  const currentScore = learnerProgressScore(currentProgress);

  if (currentScore === 0) return false;
  return otherScore === 0;
}

export function dedupeLearnerBoardEntries(
  entries: LearnerBoardEntry[],
): LearnerBoardEntry[] {
  const byName = new Map<string, LearnerBoardEntry>();

  for (const entry of entries) {
    const key = normalizeLearnerName(entry.displayName);
    const existing = byName.get(key);

    if (!existing) {
      byName.set(key, entry);
      continue;
    }

    const keepCurrent =
      entry.percentComplete > existing.percentComplete ||
      (entry.percentComplete === existing.percentComplete &&
        entry.isCurrentUser &&
        !existing.isCurrentUser) ||
      (existing.percentComplete === 0 && entry.percentComplete > 0);

    if (keepCurrent) {
      byName.set(key, entry);
    }
  }

  return [...byName.values()].sort((a, b) => {
    if (b.percentComplete !== a.percentComplete) {
      return b.percentComplete - a.percentComplete;
    }
    return a.displayName.localeCompare(b.displayName, "de");
  });
}
