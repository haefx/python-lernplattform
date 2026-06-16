import { NextResponse } from "next/server";
import {
  getCards,
  getExercises,
  getLearnerRecords,
  getPublishedLessons,
  upsertLearnerRecord,
} from "@/lib/data";
import { normalizeMazeCompletedLevels } from "@/lib/achievements";
import { buildLearnerBoard, type LessonMeta } from "@/lib/learnerBoard";
import type { LessonProgress } from "@/lib/types";

async function getLessonMeta(): Promise<LessonMeta[]> {
  const [lessons, cards, exercises] = await Promise.all([
    getPublishedLessons(),
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentVisitorId = searchParams.get("visitorId") ?? undefined;

  const [learners, lessons] = await Promise.all([
    getLearnerRecords(),
    getLessonMeta(),
  ]);

  const entries = buildLearnerBoard(learners, lessons, currentVisitorId);
  return NextResponse.json({ entries, lessons });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { visitorId, displayName, lessonProgress, mazeCompletedLevels, pcepChallengeCompleted } = body as {
    visitorId?: string;
    displayName?: string;
    lessonProgress?: LessonProgress[];
    mazeCompletedLevels?: number[];
    pcepChallengeCompleted?: boolean;
  };

  if (!visitorId?.trim()) {
    return NextResponse.json({ error: "visitorId erforderlich" }, { status: 400 });
  }

  if (!displayName?.trim()) {
    return NextResponse.json({ error: "displayName erforderlich" }, { status: 400 });
  }

  if (!Array.isArray(lessonProgress)) {
    return NextResponse.json(
      { error: "lessonProgress erforderlich" },
      { status: 400 },
    );
  }

  await upsertLearnerRecord(
    visitorId.trim(),
    displayName.trim().slice(0, 40),
    lessonProgress,
    normalizeMazeCompletedLevels(mazeCompletedLevels),
    Boolean(pcepChallengeCompleted),
  );

  return NextResponse.json({ ok: true });
}
