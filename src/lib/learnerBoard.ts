import { dedupeLearnerBoardEntries } from "./learnerDedup";
import {
  getCompletedLessonNumbers,
  normalizeMazeCompletedLevels,
} from "./achievements";
import { getCompletionCount } from "./lessonCompletion";
import type { LessonProgress } from "./types";

export interface LessonMeta {
  id: string;
  order: number;
  title: string;
  cardCount: number;
  exerciseCount: number;
}

export interface StoredLearner {
  id: string;
  displayName: string;
  lessonProgress: LessonProgress[];
  mazeCompletedLevels?: number[];
  pcepChallengeCompleted?: boolean;
  updatedAt: string;
}

export interface LearnerBoardEntry {
  id: string;
  displayName: string;
  lessonNumber: number;
  lessonTitle: string;
  percentComplete: number;
  currentRunPercent: number;
  completionCount: number;
  isRepeating: boolean;
  label: string;
  lessonMedals: number[];
  mazeMedals: number[];
  pcepChallengeMedal: boolean;
  isCurrentUser?: boolean;
}

export function lessonCurrentPercent(
  lesson: LessonMeta,
  progress: LessonProgress[],
): number {
  const lp = progress.find((p) => p.lessonId === lesson.id);
  const cardsDone = lp?.completedCardIds.length ?? 0;
  const exercisesDone = lp?.completedExerciseIds?.length ?? 0;
  const total = lesson.cardCount + lesson.exerciseCount;
  if (total === 0) return 100;
  return Math.round(((cardsDone + exercisesDone) / total) * 100);
}

function lessonIsFinishedForBoard(
  lesson: LessonMeta,
  progress: LessonProgress[],
): boolean {
  const lp = progress.find((p) => p.lessonId === lesson.id);
  return getCompletionCount(lp) > 0;
}

function buildLearnerLabel(
  displayName: string,
  lessonNumber: number,
  percentComplete: number,
  completionCount: number,
  currentRunPercent: number,
  isRepeating: boolean,
): string {
  let label = `${displayName} – Lektion ${lessonNumber} Fragen + Übungen ${percentComplete}% abgeschlossen`;

  if (completionCount > 0) {
    const repeats = completionCount - 1;
    if (repeats > 0) {
      label += ` · ${repeats}× wiederholt`;
    } else {
      label += ` · 1× abgeschlossen`;
    }
    if (isRepeating) {
      label += ` (aktuell ${currentRunPercent}%)`;
    }
  }

  return `${label}.`;
}

export function formatLearnerStatus(
  id: string,
  displayName: string,
  lessonProgress: LessonProgress[],
  lessons: LessonMeta[],
  mazeCompletedLevels: number[] = [],
  pcepChallengeCompleted = false,
): LearnerBoardEntry | null {
  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  const activeLesson =
    sorted.find((lesson) => !lessonIsFinishedForBoard(lesson, lessonProgress)) ??
    sorted[sorted.length - 1];

  const lessonNumber =
    sorted.findIndex((lesson) => lesson.id === activeLesson.id) + 1;

  const lp = lessonProgress.find((p) => p.lessonId === activeLesson.id);
  const completionCount = getCompletionCount(lp);
  const currentRunPercent = lessonCurrentPercent(activeLesson, lessonProgress);
  const percentComplete =
    completionCount > 0 ? 100 : currentRunPercent;
  const isRepeating =
    completionCount > 0 &&
    !lp?.lessonCompleted &&
    currentRunPercent < 100;

  return {
    id,
    displayName,
    lessonNumber,
    lessonTitle: activeLesson.title,
    percentComplete,
    currentRunPercent,
    completionCount,
    isRepeating,
    lessonMedals: getCompletedLessonNumbers(lessonProgress, lessons),
    mazeMedals: normalizeMazeCompletedLevels(mazeCompletedLevels),
    pcepChallengeMedal: pcepChallengeCompleted,
    label: buildLearnerLabel(
      displayName,
      lessonNumber,
      percentComplete,
      completionCount,
      currentRunPercent,
      isRepeating,
    ),
  };
}

export function buildLearnerBoard(
  learners: StoredLearner[],
  lessons: LessonMeta[],
  currentVisitorId?: string,
): LearnerBoardEntry[] {
  const entries = learners
    .map((learner) =>
      formatLearnerStatus(
        learner.id,
        learner.displayName,
        learner.lessonProgress,
        lessons,
        learner.mazeCompletedLevels,
        Boolean(learner.pcepChallengeCompleted),
      ),
    )
    .filter((entry): entry is LearnerBoardEntry => entry !== null)
    .map((entry) => ({
      ...entry,
      isCurrentUser: currentVisitorId ? entry.id === currentVisitorId : false,
    }));

  return dedupeLearnerBoardEntries(entries);
}
