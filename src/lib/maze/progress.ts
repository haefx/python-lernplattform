import {
  ADMIN_PREVIEW_MAZE_PROGRESS_KEY,
  isAdminPreviewActive,
} from "../adminPreview";
import type { LessonProgress } from "../types";
import { hasEverCompletedLesson } from "../lessonCompletion";

const MAZE_PROGRESS_KEY = "pcep-maze-progress";

function getMazeProgressKey(adminPreview = false): string {
  return adminPreview || isAdminPreviewActive()
    ? ADMIN_PREVIEW_MAZE_PROGRESS_KEY
    : MAZE_PROGRESS_KEY;
}

export interface MazeProgress {
  completedLevels: number[];
  lastLevel: number;
}

const DEFAULT_PROGRESS: MazeProgress = {
  completedLevels: [],
  lastLevel: 1,
};

export function isLabyrinthUnlocked(lessonProgress: LessonProgress[]): boolean {
  const lesson2 = lessonProgress.find((item) => item.lessonId === "lektion-2");
  return hasEverCompletedLesson(lesson2);
}

export function readMazeProgress(adminPreview = false): MazeProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(getMazeProgressKey(adminPreview));
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as MazeProgress;
    return {
      completedLevels: parsed.completedLevels ?? [],
      lastLevel: parsed.lastLevel ?? 1,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function writeMazeProgress(progress: MazeProgress, adminPreview = false): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getMazeProgressKey(adminPreview), JSON.stringify(progress));
}

export function isMazeLevelUnlocked(
  levelId: number,
  progress: MazeProgress,
  adminPreview = false,
): boolean {
  if (adminPreview || isAdminPreviewActive()) return true;
  if (levelId === 1) return true;
  if (levelId === 2) return progress.completedLevels.includes(1);
  return progress.completedLevels.includes(levelId - 1);
}

export function markMazeLevelComplete(levelId: number, adminPreview = false): MazeProgress {
  const current = readMazeProgress(adminPreview);
  const completedLevels = current.completedLevels.includes(levelId)
    ? current.completedLevels
    : [...current.completedLevels, levelId].sort((a, b) => a - b);
  const next = { completedLevels, lastLevel: levelId };
  writeMazeProgress(next, adminPreview);
  return next;
}

export function resetMazeProgress(adminPreview = false): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getMazeProgressKey(adminPreview));
}
