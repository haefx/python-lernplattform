import { NextResponse } from "next/server";
import { hasEverCompletedLesson } from "@/lib/lessonCompletion";
import {
  deleteLearnerRecords,
  getCards,
  getExercises,
  getLearnerRecords,
  getLessons,
  upsertLearnerRecord,
} from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";
import { buildLearnerBoard, type LessonMeta } from "@/lib/learnerBoard";
import type { LessonProgress } from "@/lib/types";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  return null;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function parseNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0),
  )].sort((a, b) => a - b);
}

function buildManualLessonProgress(
  lessonNumbers: number[],
  lessons: LessonMeta[],
  cards: Awaited<ReturnType<typeof getCards>>,
  exercises: Awaited<ReturnType<typeof getExercises>>,
): LessonProgress[] {
  const byNumber = [...lessons].sort((a, b) => a.order - b.order);
  const progress: LessonProgress[] = [];
  for (const lessonNumber of lessonNumbers) {
    const lesson = byNumber[lessonNumber - 1];
    if (!lesson) continue;
    progress.push({
      lessonId: lesson.id,
      completedCardIds: cards
        .filter((card) => card.lessonId === lesson.id)
        .map((card) => card.id),
      completedExerciseIds: exercises
        .filter((exercise) => exercise.lessonId === lesson.id)
        .map((exercise) => exercise.id),
      lessonCompleted: true,
      completionCount: 1,
    });
  }
  return progress;
}

async function getLessonMeta(): Promise<LessonMeta[]> {
  const [lessons, cards, exercises] = await Promise.all([
    getLessons(),
    getCards(),
    getExercises(),
  ]);

  return lessons.map((lesson) => ({
    id: lesson.id,
    order: lesson.order,
    title: lesson.title,
    cardCount: cards.filter((card) => card.lessonId === lesson.id).length,
    exerciseCount: exercises.filter((exercise) => exercise.lessonId === lesson.id)
      .length,
  }));
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [learners, lessons] = await Promise.all([
    getLearnerRecords(),
    getLessonMeta(),
  ]);

  const board = buildLearnerBoard(learners, lessons);
  const boardById = new Map(board.map((entry) => [entry.id, entry]));
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);

  const rows = learners.map((learner) => {
    const lessonNumbers = sortedLessons
      .map((lesson, index) => {
        const lp = learner.lessonProgress.find((item) => item.lessonId === lesson.id);
        return hasEverCompletedLesson(lp) ? index + 1 : null;
      })
      .filter((value): value is number => value !== null);

    const status = boardById.get(learner.id);
    return {
      id: learner.id,
      displayName: learner.displayName,
      lessonNumbers,
      mazeCompletedLevels: learner.mazeCompletedLevels ?? [],
      expertCompletedLevels: learner.expertCompletedLevels ?? [],
      pcepChallengeCompleted: Boolean(learner.pcepChallengeCompleted),
      status: status
        ? {
            lessonNumber: status.lessonNumber,
            lessonTitle: status.lessonTitle,
            percentComplete: status.percentComplete,
          }
        : null,
      updatedAt: learner.updatedAt,
    };
  });

  return NextResponse.json({ learners: rows });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { action } = body as { action?: string };

  if (action === "delete-learner") {
    const { learnerId } = body as { learnerId?: string };
    if (!learnerId?.trim()) {
      return NextResponse.json({ error: "learnerId fehlt" }, { status: 400 });
    }
    try {
      await deleteLearnerRecords([learnerId]);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json(
        { error: getErrorMessage(err, "Löschen fehlgeschlagen") },
        { status: 500 },
      );
    }
  }

  if (action === "update-learner") {
    const {
      learnerId,
      displayName,
      lessonNumbers,
      mazeCompletedLevels,
      expertCompletedLevels,
      pcepChallengeCompleted,
    } = body as {
      learnerId?: string;
      displayName?: string;
      lessonNumbers?: unknown;
      mazeCompletedLevels?: unknown;
      expertCompletedLevels?: unknown;
      pcepChallengeCompleted?: boolean;
    };

    if (!learnerId?.trim()) {
      return NextResponse.json({ error: "learnerId fehlt" }, { status: 400 });
    }
    if (!displayName?.trim()) {
      return NextResponse.json({ error: "Name fehlt" }, { status: 400 });
    }

    const [lessons, cards, exercises] = await Promise.all([
      getLessonMeta(),
      getCards(),
      getExercises(),
    ]);
    const normalizedLessonNumbers = parseNumberArray(lessonNumbers);
    const lessonProgress = buildManualLessonProgress(
      normalizedLessonNumbers,
      lessons,
      cards,
      exercises,
    );

    try {
      await upsertLearnerRecord(
        learnerId,
        displayName.trim().slice(0, 40),
        lessonProgress,
        parseNumberArray(mazeCompletedLevels),
        Boolean(pcepChallengeCompleted),
        parseNumberArray(expertCompletedLevels),
      );

      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json(
        { error: getErrorMessage(err, "Speichern fehlgeschlagen") },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}
