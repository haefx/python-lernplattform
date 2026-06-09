import type { Lesson, LessonProgress, LessonWithStats } from "./types";

export type LessonAccessState = "available" | "locked" | "coming_soon";

export function sortLessonsByOrder<T extends { order: number }>(lessons: T[]): T[] {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export function getLessonNumber(
  lesson: { id: string; order: number },
  allLessons: { id: string; order: number }[],
): number {
  const sorted = sortLessonsByOrder(allLessons);
  const index = sorted.findIndex((item) => item.id === lesson.id);
  return index >= 0 ? index + 1 : lesson.order;
}

export function getPreviousLesson(
  lesson: Lesson,
  allLessons: Lesson[],
): Lesson | undefined {
  const sorted = sortLessonsByOrder(allLessons);
  const index = sorted.findIndex((item) => item.id === lesson.id);
  if (index <= 0) return undefined;
  return sorted[index - 1];
}

export function isLessonUnlocked(
  lesson: Lesson,
  allLessons: Lesson[],
  progress: LessonProgress[],
): boolean {
  if (!lesson.published) return false;

  const previous = getPreviousLesson(lesson, allLessons);
  if (!previous) return true;

  const previousProgress = progress.find((item) => item.lessonId === previous.id);
  return previousProgress?.lessonCompleted ?? false;
}

export function getLessonAccessState(
  lesson: Lesson,
  allLessons: Lesson[],
  progress: LessonProgress[],
): LessonAccessState {
  if (!lesson.published) return "coming_soon";
  if (!isLessonUnlocked(lesson, allLessons, progress)) return "locked";
  return "available";
}

export type LessonWithAccess = LessonWithStats & {
  accessState: LessonAccessState;
  lessonNumber: number;
  previousLessonTitle?: string;
};

export function enrichLessonAccess(
  lessons: LessonWithStats[],
  progress: LessonProgress[],
): LessonWithAccess[] {
  return sortLessonsByOrder(lessons).map((lesson) => {
    const previous = getPreviousLesson(lesson, lessons);
    return {
      ...lesson,
      lessonNumber: getLessonNumber(lesson, lessons),
      accessState: getLessonAccessState(lesson, lessons, progress),
      previousLessonTitle: previous?.title,
    };
  });
}

export function allLessonsCompleted(lessons: LessonWithStats[]): boolean {
  if (lessons.length === 0) return false;
  return lessons.every((lesson) => lesson.lessonCompleted);
}

export function allPublishedLessonsCompleted(
  lessons: LessonWithStats[],
): boolean {
  const published = lessons.filter((lesson) => lesson.published);
  if (published.length === 0) return false;
  return published.every((lesson) => lesson.lessonCompleted);
}

export function hasUnpublishedLessons(lessons: Lesson[]): boolean {
  return lessons.some((lesson) => !lesson.published);
}

export function findNextLesson(
  currentLesson: Lesson,
  allLessons: Lesson[],
): Lesson | undefined {
  const sorted = sortLessonsByOrder(allLessons);
  const index = sorted.findIndex((lesson) => lesson.id === currentLesson.id);
  if (index < 0 || index >= sorted.length - 1) return undefined;
  return sorted[index + 1];
}
