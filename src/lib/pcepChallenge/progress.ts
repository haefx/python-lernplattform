import { hasEverCompletedLesson } from "../lessonCompletion";
import type { LessonProgress } from "../types";
import type { PcepChallengeProgress } from "./types";

const STORAGE_KEY = "pcep-challenge-progress";

export const PCEP_CHALLENGE_PROGRESS_EVENT = "pcep-challenge-progress-updated";

const DEFAULT_PROGRESS: PcepChallengeProgress = {
  completed: false,
  bestTimeMs: null,
  lastTimeMs: null,
  attemptCount: 0,
};

export function isPcepChallengeUnlocked(
  lessonProgress: LessonProgress[],
): boolean {
  const lesson4 = lessonProgress.find((item) => item.lessonId === "lektion-4");
  return hasEverCompletedLesson(lesson4);
}

export function readPcepChallengeProgress(): PcepChallengeProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as PcepChallengeProgress;
    return {
      completed: Boolean(parsed.completed),
      bestTimeMs:
        typeof parsed.bestTimeMs === "number" ? parsed.bestTimeMs : null,
      lastTimeMs:
        typeof parsed.lastTimeMs === "number" ? parsed.lastTimeMs : null,
      completedAt: parsed.completedAt,
      attemptCount: parsed.attemptCount ?? 0,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function writePcepChallengeProgress(
  progress: PcepChallengeProgress,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent(PCEP_CHALLENGE_PROGRESS_EVENT));
}

export function markPcepChallengeComplete(elapsedMs: number): PcepChallengeProgress {
  const current = readPcepChallengeProgress();
  const bestTimeMs =
    current.bestTimeMs === null
      ? elapsedMs
      : Math.min(current.bestTimeMs, elapsedMs);

  const next: PcepChallengeProgress = {
    completed: true,
    bestTimeMs,
    lastTimeMs: elapsedMs,
    completedAt: new Date().toISOString(),
    attemptCount: current.attemptCount + 1,
  };

  writePcepChallengeProgress(next);
  return next;
}

export function formatChallengeDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} Sek.`;
  return `${minutes}:${seconds.toString().padStart(2, "0")} Min.`;
}
