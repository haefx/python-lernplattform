import { syncLessonCompletion } from "./progressSync";
import type {
  Exercise,
  Flashcard,
  Lesson,
  LessonProgress,
  LessonWithStats,
} from "./types";

const PROGRESS_KEY = "pcep-visitor-progress";
export const PROGRESS_UPDATED_EVENT = "pcep-progress-updated";

function readList(): LessonProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { lessonProgress?: LessonProgress[] };
    return data.lessonProgress ?? [];
  } catch {
    return [];
  }
}

function writeList(lessonProgress: LessonProgress[]) {
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({
      lessonProgress,
      updatedAt: new Date().toISOString(),
    }),
  );
  window.dispatchEvent(new Event(PROGRESS_UPDATED_EVENT));
}

function getOrCreateLesson(
  lessonProgress: LessonProgress[],
  lessonId: string,
): LessonProgress {
  let lp = lessonProgress.find((p) => p.lessonId === lessonId);
  if (!lp) {
    lp = {
      lessonId,
      completedCardIds: [],
      completedExerciseIds: [],
      lessonCompleted: false,
    };
    lessonProgress.push(lp);
  }
  if (!lp.completedExerciseIds) {
    lp.completedExerciseIds = [];
  }
  return lp;
}

export function getLessonProgressList(): LessonProgress[] {
  return readList();
}

export function getLessonProgress(lessonId: string): LessonProgress | undefined {
  return readList().find((p) => p.lessonId === lessonId);
}

export function clearVisitorProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROGRESS_KEY);
  window.dispatchEvent(new Event(PROGRESS_UPDATED_EVENT));
}

export function clearLessonProgress(lessonId: string): void {
  const list = readList().filter((p) => p.lessonId !== lessonId);
  writeList(list);
}

export function markCardComplete(
  lessonId: string,
  cardId: string,
  cards: Flashcard[],
  exercises: Exercise[],
): LessonProgress {
  const list = readList();
  const lp = getOrCreateLesson(list, lessonId);

  if (!lp.completedCardIds.includes(cardId)) {
    lp.completedCardIds.push(cardId);
  }

  syncLessonCompletion(lp, cards, exercises);
  writeList(list);
  return lp;
}

export function toggleExerciseComplete(
  lessonId: string,
  exerciseId: string,
  cards: Flashcard[],
  exercises: Exercise[],
): string[] {
  const list = readList();
  const lp = getOrCreateLesson(list, lessonId);

  const idx = lp.completedExerciseIds!.indexOf(exerciseId);
  if (idx >= 0) {
    lp.completedExerciseIds!.splice(idx, 1);
  } else {
    lp.completedExerciseIds!.push(exerciseId);
  }

  syncLessonCompletion(lp, cards, exercises);
  writeList(list);
  return [...lp.completedExerciseIds!];
}

export type LessonWithCardCount = Lesson & { cardCount: number };

export function enrichLessonsWithProgress(
  lessons: LessonWithCardCount[],
): LessonWithStats[] {
  const progress = readList();
  return lessons.map((lesson) => {
    const lp = progress.find((p) => p.lessonId === lesson.id);
    return {
      ...lesson,
      completedCards: lp?.completedCardIds.length ?? 0,
      lessonCompleted: lp?.lessonCompleted ?? false,
    };
  });
}

export function computeProgressTotals(lessons: LessonWithStats[]) {
  const totalCards = lessons.reduce((sum, l) => sum + l.cardCount, 0);
  const totalCompleted = lessons.reduce((sum, l) => sum + l.completedCards, 0);
  const lessonsDone = lessons.filter((l) => l.lessonCompleted).length;
  return { totalCards, totalCompleted, lessonsDone };
}
