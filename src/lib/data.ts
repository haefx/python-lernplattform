import { promises as fs } from "fs";
import path from "path";
import { isStaleLearnerDuplicate } from "./learnerDedup";
import type { StoredLearner } from "./learnerBoard";
import type { Exercise, Flashcard, Lesson, LessonProgress, SiteProgress } from "./types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase/server";

const DATA_DIR = path.join(process.cwd(), "data");

const lessonsPath = path.join(DATA_DIR, "lessons.json");
const cardsPath = path.join(DATA_DIR, "cards.json");
const exercisesPath = path.join(DATA_DIR, "exercises.json");
const progressPath = path.join(DATA_DIR, "progress.json");
const learnersPath = path.join(DATA_DIR, "learners.json");

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

type LessonRow = {
  id: string;
  title: string;
  description: string;
  order: number;
  published: boolean;
  pcep_topic: string | null;
};

type FlashcardRow = {
  id: string;
  lesson_id: string;
  order: number;
  question: string;
  tip: string;
  tip2_messages: string[];
  tip3_messages: string[];
  answer: string;
  detail: string | null;
  code_example: string | null;
  learn_more_url: string | null;
  learn_more_label: string | null;
};

type ExerciseRow = {
  id: string;
  lesson_id: string;
  order: number;
  title: string;
  task: string;
  solution: string;
  notes: string | null;
  starter_code: string | null;
  solution_code: string | null;
};

function mapLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    order: row.order,
    published: row.published,
    pcepTopic: row.pcep_topic ?? undefined,
  };
}

function mapFlashcard(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    order: row.order,
    question: row.question,
    tip: row.tip,
    tip2Messages: row.tip2_messages?.length ? row.tip2_messages : undefined,
    tip3Messages: row.tip3_messages?.length ? row.tip3_messages : undefined,
    answer: row.answer,
    detail: row.detail ?? undefined,
    codeExample: row.code_example ?? undefined,
    learnMoreUrl: row.learn_more_url ?? undefined,
    learnMoreLabel: row.learn_more_label ?? undefined,
  };
}

function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    order: row.order,
    title: row.title,
    task: row.task,
    solution: row.solution,
    notes: row.notes ?? undefined,
    starterCode: row.starter_code ?? undefined,
    solutionCode: row.solution_code ?? undefined,
  };
}

function lessonToRow(lesson: Lesson): LessonRow {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    published: lesson.published,
    pcep_topic: lesson.pcepTopic ?? null,
  };
}

function flashcardToRow(card: Flashcard): FlashcardRow {
  return {
    id: card.id,
    lesson_id: card.lessonId,
    order: card.order,
    question: card.question,
    tip: card.tip,
    tip2_messages: card.tip2Messages ?? [],
    tip3_messages: card.tip3Messages ?? [],
    answer: card.answer,
    detail: card.detail ?? null,
    code_example: card.codeExample ?? null,
    learn_more_url: card.learnMoreUrl ?? null,
    learn_more_label: card.learnMoreLabel ?? null,
  };
}

function exerciseToRow(exercise: Exercise): ExerciseRow {
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
  };
}

export async function getLessons(): Promise<Lesson[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_lessons")
      .select("*")
      .order("order");
    if (error) throw error;
    return (data as LessonRow[]).map(mapLesson);
  }

  const lessons = await readJson<Lesson[]>(lessonsPath, []);
  return lessons.sort((a, b) => a.order - b.order);
}

export async function getPublishedLessons(): Promise<Lesson[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_lessons")
      .select("*")
      .eq("published", true)
      .order("order");
    if (error) throw error;
    return (data as LessonRow[]).map(mapLesson);
  }

  const lessons = await getLessons();
  return lessons.filter((l) => l.published);
}

export async function getLessonById(id: string): Promise<Lesson | undefined> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_lessons")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapLesson(data as LessonRow) : undefined;
  }

  const lessons = await getLessons();
  return lessons.find((l) => l.id === id);
}

export async function saveLessons(lessons: Lesson[]): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const rows = lessons.map(lessonToRow);
    const { error } = await supabase.from("pcep_lessons").upsert(rows, {
      onConflict: "id",
    });
    if (error) throw error;
    return;
  }

  await writeJson(lessonsPath, lessons);
}

export async function getCards(): Promise<Flashcard[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_flashcards")
      .select("*")
      .order("order");
    if (error) throw error;
    return (data as FlashcardRow[]).map(mapFlashcard);
  }

  const cards = await readJson<Flashcard[]>(cardsPath, []);
  return cards.sort((a, b) => a.order - b.order);
}

export async function getCardsByLesson(lessonId: string): Promise<Flashcard[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_flashcards")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order");
    if (error) throw error;
    return (data as FlashcardRow[]).map(mapFlashcard);
  }

  const cards = await getCards();
  return cards
    .filter((c) => c.lessonId === lessonId)
    .sort((a, b) => a.order - b.order);
}

export async function saveCards(cards: Flashcard[]): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await getSupabaseAdmin()
      .from("pcep_flashcards")
      .upsert(cards.map(flashcardToRow), { onConflict: "id" });
    if (error) throw error;
    return;
  }

  await writeJson(cardsPath, cards);
}

export async function getExercises(): Promise<Exercise[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_exercises")
      .select("*")
      .order("order");
    if (error) throw error;
    return (data as ExerciseRow[]).map(mapExercise);
  }

  const exercises = await readJson<Exercise[]>(exercisesPath, []);
  return exercises.sort((a, b) => a.order - b.order);
}

export async function getExercisesByLesson(lessonId: string): Promise<Exercise[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_exercises")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order");
    if (error) throw error;
    return (data as ExerciseRow[]).map(mapExercise);
  }

  const exercises = await getExercises();
  return exercises
    .filter((e) => e.lessonId === lessonId)
    .sort((a, b) => a.order - b.order);
}

export async function saveExercises(exercises: Exercise[]): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await getSupabaseAdmin()
      .from("pcep_exercises")
      .upsert(exercises.map(exerciseToRow), { onConflict: "id" });
    if (error) throw error;
    return;
  }

  await writeJson(exercisesPath, exercises);
}

export async function getProgress(): Promise<SiteProgress> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();

    const { data: site, error: siteErr } = await supabase
      .from("pcep_site_progress")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (siteErr) throw siteErr;

    const { data: lessonRows, error: lpErr } = await supabase
      .from("pcep_lesson_progress")
      .select("*");

    if (lpErr) throw lpErr;

    return {
      learnerName: site?.learner_name ?? "",
      onboarded: site?.onboarded ?? Boolean(site?.learner_name),
      lessonProgress: (lessonRows ?? []).map((lp) => ({
        lessonId: lp.lesson_id,
        completedCardIds: lp.completed_card_ids ?? [],
        completedExerciseIds: lp.completed_exercise_ids ?? [],
        lessonCompleted: lp.lesson_completed ?? false,
        completedAt: lp.completed_at ?? undefined,
      })),
      updatedAt: site?.updated_at ?? new Date().toISOString(),
      progressResetAt: site?.progress_reset_at ?? undefined,
    };
  }

  const raw = await readJson<SiteProgress & { bio?: string }>(progressPath, {
    learnerName: "",
    onboarded: false,
    lessonProgress: [],
    updatedAt: new Date().toISOString(),
  });
  return {
    learnerName: raw.learnerName ?? "",
    onboarded: raw.onboarded ?? Boolean(raw.learnerName),
    lessonProgress: raw.lessonProgress ?? [],
    updatedAt: raw.updatedAt,
    progressResetAt: raw.progressResetAt,
  };
}

export async function getProgressResetAt(): Promise<string | null> {
  const progress = await getProgress();
  return progress.progressResetAt ?? null;
}

function isServerlessDeployment(): boolean {
  return Boolean(process.env.VERCEL);
}

/** Setzt Lernmonitor und Fortschritt zurück; Lektionen, Karten und Namen bleiben. */
export async function resetAllProgress(): Promise<string> {
  const resetAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("pcep_reset_all_progress");
    if (error) throw error;

    if (typeof data === "string" && data) {
      return data;
    }

    return resetAt;
  }

  if (isServerlessDeployment()) {
    throw new Error(
      "Supabase ist auf Vercel nicht konfiguriert. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY als Umgebungsvariablen setzen.",
    );
  }

  const learners = await readJson<StoredLearner[]>(learnersPath, []);
  const clearedLearners = learners.map((learner) => ({
    ...learner,
    lessonProgress: [],
    updatedAt: resetAt,
  }));
  await writeJson(learnersPath, clearedLearners);

  await writeJson(progressPath, {
    learnerName: "",
    onboarded: false,
    lessonProgress: [],
    updatedAt: resetAt,
    progressResetAt: resetAt,
  } satisfies SiteProgress);

  return resetAt;
}

export async function saveProgress(progress: SiteProgress): Promise<void> {
  progress.updatedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();

    const { error: siteErr } = await supabase.from("pcep_site_progress").upsert(
      {
        id: "default",
        learner_name: progress.learnerName,
        onboarded: progress.onboarded,
        updated_at: progress.updatedAt,
      },
      { onConflict: "id" },
    );
    if (siteErr) throw siteErr;

    if (progress.lessonProgress.length > 0) {
      const rows = progress.lessonProgress.map((lp) => ({
        lesson_id: lp.lessonId,
        completed_card_ids: lp.completedCardIds,
        completed_exercise_ids: lp.completedExerciseIds ?? [],
        lesson_completed: lp.lessonCompleted,
        completed_at: lp.completedAt ?? null,
      }));

      const { error: lpErr } = await supabase
        .from("pcep_lesson_progress")
        .upsert(rows, { onConflict: "lesson_id" });
      if (lpErr) throw lpErr;
    }

    return;
  }

  await writeJson(progressPath, progress);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type LearnerRow = {
  id: string;
  display_name: string;
  lesson_progress: LessonProgress[];
  updated_at: string;
};

function mapLearner(row: LearnerRow): StoredLearner {
  return {
    id: row.id,
    displayName: row.display_name,
    lessonProgress: row.lesson_progress ?? [],
    updatedAt: row.updated_at,
  };
}

export async function getLearnerRecords(): Promise<StoredLearner[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_learners")
      .select("*")
      .neq("display_name", "")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => mapLearner(row as LearnerRow));
  }

  return readJson<StoredLearner[]>(learnersPath, []);
}

export async function deleteLearnerRecords(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  if (isSupabaseConfigured()) {
    const { error } = await getSupabaseAdmin()
      .from("pcep_learners")
      .delete()
      .in("id", ids);
    if (error) throw error;
    return;
  }

  const learners = await readJson<StoredLearner[]>(learnersPath, []);
  const remaining = learners.filter((learner) => !ids.includes(learner.id));
  await writeJson(learnersPath, remaining);
}

async function pruneStaleLearnerDuplicates(
  currentId: string,
  displayName: string,
  lessonProgress: LessonProgress[],
): Promise<void> {
  const learners = await getLearnerRecords();
  const staleIds = learners
    .filter((learner) =>
      isStaleLearnerDuplicate(learner, currentId, displayName, lessonProgress),
    )
    .map((learner) => learner.id);

  await deleteLearnerRecords(staleIds);
}

export async function upsertLearnerRecord(
  id: string,
  displayName: string,
  lessonProgress: LessonProgress[],
): Promise<StoredLearner> {
  const updatedAt = new Date().toISOString();
  const trimmedName = displayName.trim();

  await pruneStaleLearnerDuplicates(id, trimmedName, lessonProgress);

  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("pcep_learners")
      .upsert(
        {
          id,
          display_name: trimmedName,
          lesson_progress: lessonProgress,
          updated_at: updatedAt,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    if (error) throw error;
    return mapLearner(data as LearnerRow);
  }

  const learners = await readJson<StoredLearner[]>(learnersPath, []);
  const next: StoredLearner = {
    id,
    displayName: trimmedName,
    lessonProgress,
    updatedAt,
  };
  const idx = learners.findIndex((learner) => learner.id === id);
  if (idx >= 0) learners[idx] = next;
  else learners.push(next);
  await writeJson(learnersPath, learners);
  return next;
}
