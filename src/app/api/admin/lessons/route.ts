import { NextResponse } from "next/server";
import {
  generateId,
  getCards,
  getExercises,
  getLessons,
  saveCards,
  saveExercises,
  saveLessons,
} from "@/lib/data";
import { isAdminAuthenticated } from "@/lib/auth";
import { syncContentFromJsonFiles } from "@/lib/syncContentFromJson";
import type { Exercise, Flashcard, Lesson } from "@/lib/types";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  return null;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalMessages(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const messages = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return messages.length > 0 ? messages : undefined;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [lessons, cards, exercises] = await Promise.all([
    getLessons(),
    getCards(),
    getExercises(),
  ]);
  return NextResponse.json({ lessons, cards, exercises });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { action } = body as { action: string };

  if (action === "sync-content") {
    const { lessonId } = body as { lessonId?: string };
    try {
      const result = await syncContentFromJsonFiles(
        typeof lessonId === "string" && lessonId ? lessonId : undefined,
      );
      return NextResponse.json({ ok: true, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync fehlgeschlagen";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "toggle-publish") {
    const { lessonId } = body as { lessonId: string };
    const lessons = await getLessons();
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lektion nicht gefunden" }, { status: 404 });
    }
    lesson.published = !lesson.published;
    await saveLessons(lessons);
    return NextResponse.json({ lesson });
  }

  if (action === "create-lesson") {
    const { title, description, pcepTopic } = body as {
      title: string;
      description: string;
      pcepTopic?: string;
    };
    const lessons = await getLessons();
    const newLesson: Lesson = {
      id: generateId(),
      title,
      description,
      order: lessons.length + 1,
      published: false,
      pcepTopic: optionalString(pcepTopic),
    };
    lessons.push(newLesson);
    await saveLessons(lessons);
    return NextResponse.json({ lesson: newLesson });
  }

  if (action === "update-lesson") {
    const { lessonId, title, description, pcepTopic } = body as {
      lessonId: string;
      title: string;
      description: string;
      pcepTopic?: string;
    };
    const lessons = await getLessons();
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lektion nicht gefunden" }, { status: 404 });
    }
    lesson.title = title;
    lesson.description = description;
    lesson.pcepTopic = optionalString(pcepTopic);
    await saveLessons(lessons);
    return NextResponse.json({ lesson });
  }

  if (action === "create-card") {
    const {
      lessonId,
      question,
      tip,
      tip2Messages,
      tip3Messages,
      answer,
      detail,
      codeExample,
      learnMoreUrl,
      learnMoreLabel,
    } = body as {
      lessonId: string;
      question: string;
      tip: string;
      tip2Messages?: string[];
      tip3Messages?: string[];
      answer: string;
      detail?: string;
      codeExample?: string;
      learnMoreUrl?: string;
      learnMoreLabel?: string;
    };
    const cards = await getCards();
    const lessonCards = cards.filter((c) => c.lessonId === lessonId);
    const newCard: Flashcard = {
      id: generateId(),
      lessonId,
      order: lessonCards.length + 1,
      question,
      tip,
      tip2Messages: optionalMessages(tip2Messages),
      tip3Messages: optionalMessages(tip3Messages),
      answer,
      detail: optionalString(detail),
      codeExample: optionalString(codeExample),
      learnMoreUrl: optionalString(learnMoreUrl),
      learnMoreLabel: optionalString(learnMoreLabel),
    };
    cards.push(newCard);
    await saveCards(cards);
    return NextResponse.json({ card: newCard });
  }

  if (action === "update-card") {
    const {
      cardId,
      question,
      tip,
      tip2Messages,
      tip3Messages,
      answer,
      detail,
      codeExample,
      learnMoreUrl,
      learnMoreLabel,
    } = body as {
      cardId: string;
      question: string;
      tip: string;
      tip2Messages?: string[];
      tip3Messages?: string[];
      answer: string;
      detail?: string;
      codeExample?: string;
      learnMoreUrl?: string;
      learnMoreLabel?: string;
    };
    const cards = await getCards();
    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      return NextResponse.json({ error: "Karte nicht gefunden" }, { status: 404 });
    }
    card.question = question;
    card.tip = tip;
    card.tip2Messages = optionalMessages(tip2Messages);
    card.tip3Messages = optionalMessages(tip3Messages);
    card.answer = answer;
    card.detail = optionalString(detail);
    card.codeExample = optionalString(codeExample);
    card.learnMoreUrl = optionalString(learnMoreUrl);
    card.learnMoreLabel = optionalString(learnMoreLabel);
    await saveCards(cards);
    return NextResponse.json({ card });
  }

  if (action === "delete-card") {
    const { cardId } = body as { cardId: string };
    const cards = await getCards();
    const filtered = cards.filter((c) => c.id !== cardId);
    await saveCards(filtered);
    return NextResponse.json({ ok: true });
  }

  if (action === "create-exercise") {
    const {
      lessonId,
      title,
      task,
      solution,
      notes,
      starterCode,
      solutionCode,
    } = body as {
      lessonId: string;
      title: string;
      task: string;
      solution: string;
      notes?: string;
      starterCode?: string;
      solutionCode?: string;
    };
    const exercises = await getExercises();
    const lessonExercises = exercises.filter((e) => e.lessonId === lessonId);
    const newExercise: Exercise = {
      id: generateId(),
      lessonId,
      order: lessonExercises.length + 1,
      title,
      task,
      solution,
      notes: optionalString(notes),
      starterCode: optionalString(starterCode),
      solutionCode: optionalString(solutionCode),
    };
    exercises.push(newExercise);
    await saveExercises(exercises);
    return NextResponse.json({ exercise: newExercise });
  }

  if (action === "update-exercise") {
    const {
      exerciseId,
      title,
      task,
      solution,
      notes,
      starterCode,
      solutionCode,
    } = body as {
      exerciseId: string;
      title: string;
      task: string;
      solution: string;
      notes?: string;
      starterCode?: string;
      solutionCode?: string;
    };
    const exercises = await getExercises();
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) {
      return NextResponse.json({ error: "Übung nicht gefunden" }, { status: 404 });
    }
    exercise.title = title;
    exercise.task = task;
    exercise.solution = solution;
    exercise.notes = optionalString(notes);
    exercise.starterCode = optionalString(starterCode);
    exercise.solutionCode = optionalString(solutionCode);
    await saveExercises(exercises);
    return NextResponse.json({ exercise });
  }

  if (action === "delete-exercise") {
    const { exerciseId } = body as { exerciseId: string };
    const exercises = await getExercises();
    const filtered = exercises.filter((e) => e.id !== exerciseId);
    await saveExercises(filtered);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { lessons, cards, exercises } = body as {
    lessons?: Lesson[];
    cards?: Flashcard[];
    exercises?: Exercise[];
  };

  if (lessons) await saveLessons(lessons);
  if (cards) await saveCards(cards);
  if (exercises) await saveExercises(exercises);

  return NextResponse.json({ ok: true });
}
