import { NextResponse } from "next/server";
import {
  getCardsByLesson,
  getExercisesByLesson,
  getLessonById,
  getProgress,
  saveProgress,
} from "@/lib/data";
import { syncLessonCompletion } from "@/lib/progressSync";
import type { LessonProgress } from "@/lib/types";

export async function GET() {
  const progress = await getProgress();
  return NextResponse.json(progress);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { lessonId, cardId, exerciseId, type } = body as {
    lessonId: string;
    cardId?: string;
    exerciseId?: string;
    type?: "card" | "exercise";
  };

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId erforderlich" }, { status: 400 });
  }

  const lesson = await getLessonById(lessonId);
  if (!lesson?.published) {
    return NextResponse.json({ error: "Lektion nicht verfügbar" }, { status: 404 });
  }

  const progress = await getProgress();
  let lp = progress.lessonProgress.find((p) => p.lessonId === lessonId);

  if (!lp) {
    lp = { lessonId, completedCardIds: [], completedExerciseIds: [], lessonCompleted: false };
    progress.lessonProgress.push(lp);
  }

  if (!lp.completedExerciseIds) {
    lp.completedExerciseIds = [];
  }

  if (type === "exercise" || exerciseId) {
    if (!exerciseId) {
      return NextResponse.json({ error: "exerciseId erforderlich" }, { status: 400 });
    }

    const [cards, lessonExercises] = await Promise.all([
      getCardsByLesson(lessonId),
      getExercisesByLesson(lessonId),
    ]);

    if (!lessonExercises.find((e) => e.id === exerciseId)) {
      return NextResponse.json({ error: "Übung nicht gefunden" }, { status: 404 });
    }

    const idx = lp.completedExerciseIds.indexOf(exerciseId);
    if (idx >= 0) {
      lp.completedExerciseIds.splice(idx, 1);
    } else {
      lp.completedExerciseIds.push(exerciseId);
    }

    syncLessonCompletion(lp, cards, lessonExercises);

    await saveProgress(progress);

    return NextResponse.json({
      completedExerciseIds: lp.completedExerciseIds,
      lessonProgress: lp,
    });
  }

  if (!cardId) {
    return NextResponse.json({ error: "cardId erforderlich" }, { status: 400 });
  }

  const cards = await getCardsByLesson(lessonId);
  if (!cards.find((c) => c.id === cardId)) {
    return NextResponse.json({ error: "Karte nicht gefunden" }, { status: 404 });
  }

  if (!lp.completedCardIds.includes(cardId)) {
    lp.completedCardIds.push(cardId);
  }

  const lessonExercises = await getExercisesByLesson(lessonId);
  syncLessonCompletion(lp, cards, lessonExercises);

  await saveProgress(progress);

  return NextResponse.json({
    lessonProgress: lp,
    totalCards: cards.length,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { learnerName, onboarded } = body as {
    learnerName?: string;
    onboarded?: boolean;
  };

  const progress = await getProgress();
  if (learnerName !== undefined) progress.learnerName = learnerName.trim();
  if (onboarded !== undefined) progress.onboarded = onboarded;

  await saveProgress(progress);
  return NextResponse.json(progress);
}

export async function DELETE() {
  await saveProgress({
    learnerName: "",
    onboarded: false,
    lessonProgress: [],
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
