/**
 * Lädt nur Lektionen, Karten und Übungen aus data/*.json nach Supabase.
 * Überschreibt KEINEN Nutzer-Fortschritt (pcep_site_progress / pcep_lesson_progress).
 *
 * Ausführen: node --env-file=.env.local scripts/seed-content-supabase.mjs
 * Optional nur eine Lektion: node --env-file=.env.local scripts/seed-content-supabase.mjs lektion-3
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const lessonFilter = process.argv[2] ?? null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Fehler: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY setzen (z. B. in .env.local).",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function readJson(name) {
  return JSON.parse(readFileSync(join(dataDir, name), "utf-8"));
}

const lessons = readJson("lessons.json");
let cards = readJson("cards.json");
let exercises = readJson("exercises.json");

if (lessonFilter) {
  cards = cards.filter((c) => c.lessonId === lessonFilter);
  exercises = exercises.filter((e) => e.lessonId === lessonFilter);
  console.log(`Filter: nur ${lessonFilter}`);
}

const lessonRows = lessons.map((l) => ({
  id: l.id,
  title: l.title,
  description: l.description,
  order: l.order,
  published: l.published,
  pcep_topic: l.pcepTopic ?? null,
}));

const cardRows = cards.map((c) => ({
  id: c.id,
  lesson_id: c.lessonId,
  order: c.order,
  question: c.question,
  tip: c.tip ?? "",
  tip2_messages: c.tip2Messages ?? [],
  tip3_messages: c.tip3Messages ?? [],
  answer: c.answer,
  detail: c.detail ?? null,
  code_example: c.codeExample ?? null,
  learn_more_url: c.learnMoreUrl ?? null,
  learn_more_label: c.learnMoreLabel ?? null,
  card_type: c.multipleChoice ? "multiple_choice" : c.cardType ?? "flip",
  mc_options: c.multipleChoice?.options ?? null,
  mc_correct_index: c.multipleChoice?.correctIndex ?? null,
}));

const exerciseRows = exercises.map((e) => ({
  id: e.id,
  lesson_id: e.lessonId,
  order: e.order,
  title: e.title,
  task: e.task,
  solution: e.solution,
  notes: e.notes ?? null,
  starter_code: e.starterCode ?? null,
  solution_code: e.solutionCode ?? null,
  exercise_type: e.gapFill ? "gap_fill" : e.exerciseType ?? "code",
  gap_fill: e.gapFill ?? null,
}));

async function upsert(table, rows, onConflict = "id") {
  if (rows.length === 0) {
    console.log(`○ ${table}: nichts zu synchronisieren`);
    return;
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table}: ${rows.length} Zeilen`);
}

async function main() {
  if (lessonFilter) {
    const filteredLessons = lessons.filter((l) => l.id === lessonFilter);
    await upsert(
      "pcep_lessons",
      filteredLessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        order: l.order,
        published: l.published,
        pcep_topic: l.pcepTopic ?? null,
      })),
    );
    await upsert("pcep_flashcards", cardRows);
    await upsert("pcep_exercises", exerciseRows);
  } else {
    await upsert("pcep_lessons", lessonRows);
    await upsert("pcep_flashcards", cardRows);
    await upsert("pcep_exercises", exerciseRows);
  }

  console.log("\nContent-Sync abgeschlossen (ohne Fortschrittsdaten).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
