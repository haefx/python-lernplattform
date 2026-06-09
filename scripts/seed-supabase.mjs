/**
 * Lädt data/*.json in Supabase (pcep_* Tabellen).
 * Voraussetzung: .env.local mit NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY
 *
 * Ausführen: node --env-file=.env.local scripts/seed-supabase.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");

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
const cards = readJson("cards.json");
const exercises = readJson("exercises.json");
const progress = readJson("progress.json");

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
}));

async function upsert(table, rows, onConflict = "id") {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table}: ${rows.length} Zeilen`);
}

async function main() {
  await upsert("pcep_lessons", lessonRows);
  await upsert("pcep_flashcards", cardRows);
  await upsert("pcep_exercises", exerciseRows);

  const { error: siteErr } = await supabase.from("pcep_site_progress").upsert(
    {
      id: "default",
      learner_name: progress.learnerName ?? "",
      onboarded: progress.onboarded ?? false,
      updated_at: progress.updatedAt ?? new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (siteErr) throw new Error(`pcep_site_progress: ${siteErr.message}`);
  console.log("✓ pcep_site_progress: 1 Zeile");

  const lessonProgress = progress.lessonProgress ?? [];
  if (lessonProgress.length > 0) {
    const lpRows = lessonProgress.map((lp) => ({
      lesson_id: lp.lessonId,
      completed_card_ids: lp.completedCardIds ?? [],
      completed_exercise_ids: lp.completedExerciseIds ?? [],
      lesson_completed: lp.lessonCompleted ?? false,
      completed_at: lp.completedAt ?? null,
    }));
    await upsert("pcep_lesson_progress", lpRows, "lesson_id");
  } else {
    console.log("✓ pcep_lesson_progress: keine Einträge in progress.json");
  }

  console.log("\nSeed abgeschlossen.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
