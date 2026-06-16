import { promises as fs } from "fs";
import path from "path";
import type { Exercise, Flashcard, Lesson } from "./types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase/server";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJsonFile<T>(name: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, name), "utf-8");
  return JSON.parse(raw) as T;
}

function lessonToRow(lesson: Lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    published: lesson.published,
    pcep_topic: lesson.pcepTopic ?? null,
  };
}

function flashcardToRow(card: Flashcard) {
  return {
    id: card.id,
    lesson_id: card.lessonId,
    order: card.order,
    question: card.question,
    tip: card.tip ?? "",
    tip2_messages: card.tip2Messages ?? [],
    tip3_messages: card.tip3Messages ?? [],
    answer: card.answer,
    detail: card.detail ?? null,
    code_example: card.codeExample ?? null,
    learn_more_url: card.learnMoreUrl ?? null,
    learn_more_label: card.learnMoreLabel ?? null,
    card_type: card.multipleChoice ? "multiple_choice" : card.cardType ?? "flip",
    mc_options: card.multipleChoice?.options ?? null,
    mc_correct_index: card.multipleChoice?.correctIndex ?? null,
  };
}

function exerciseToRow(exercise: Exercise) {
  return {
    id: exercise.id,
    lesson_id: exercise.lessonId,
    order: exercise.order,
    title: exercise.title,
    task: exercise.task,
    solution: exercise.solution,
    notes: exercise.notes ?? null,
    starter_code: exercise.starterCode ?? null,
    solution_code: exercise.solutionCode ?? null,
    exercise_type: exercise.gapFill ? "gap_fill" : exercise.exerciseType ?? "code",
    gap_fill: exercise.gapFill ?? null,
  };
}

export type ContentSyncResult = {
  lessons: number;
  cards: number;
  exercises: number;
};

/** Lädt data/*.json nach Supabase – überschreibt keinen Nutzer-Fortschritt. */
export async function syncContentFromJsonFiles(
  lessonId?: string,
): Promise<ContentSyncResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase ist nicht konfiguriert.");
  }

  const supabase = getSupabaseAdmin();
  let lessons = await readJsonFile<Lesson[]>("lessons.json");
  let cards = await readJsonFile<Flashcard[]>("cards.json");
  let exercises = await readJsonFile<Exercise[]>("exercises.json");

  if (lessonId) {
    lessons = lessons.filter((l) => l.id === lessonId);
    cards = cards.filter((c) => c.lessonId === lessonId);
    exercises = exercises.filter((e) => e.lessonId === lessonId);
    if (lessons.length === 0) {
      throw new Error(`Lektion „${lessonId}“ nicht in data/lessons.json gefunden.`);
    }
  }

  const result: ContentSyncResult = { lessons: 0, cards: 0, exercises: 0 };

  if (lessons.length > 0) {
    const { error } = await supabase
      .from("pcep_lessons")
      .upsert(lessons.map(lessonToRow), { onConflict: "id" });
    if (error) throw new Error(`pcep_lessons: ${error.message}`);
    result.lessons = lessons.length;
  }

  if (cards.length > 0) {
    const { error } = await supabase
      .from("pcep_flashcards")
      .upsert(cards.map(flashcardToRow), { onConflict: "id" });
    if (error) throw new Error(`pcep_flashcards: ${error.message}`);
    result.cards = cards.length;
  }

  if (exercises.length > 0) {
    const { error } = await supabase
      .from("pcep_exercises")
      .upsert(exercises.map(exerciseToRow), { onConflict: "id" });
    if (error) throw new Error(`pcep_exercises: ${error.message}`);
    result.exercises = exercises.length;
  }

  return result;
}
