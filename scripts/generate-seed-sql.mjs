/**
 * Erzeugt SQL zum Befüllen der pcep_* Tabellen aus data/*.json (stdout).
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");

function readJson(name) {
  return JSON.parse(readFileSync(join(dataDir, name), "utf-8"));
}

const lessons = readJson("lessons.json").map((l) => ({
  id: l.id,
  title: l.title,
  description: l.description,
  order: l.order,
  published: l.published,
  pcep_topic: l.pcepTopic ?? null,
}));

const cards = readJson("cards.json").map((c) => ({
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

const exercises = readJson("exercises.json").map((e) => ({
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

const progress = readJson("progress.json");

function jsonBlock(data) {
  return `$pcep$${JSON.stringify(data)}$pcep$`;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const sql = `
INSERT INTO pcep_lessons (id, title, description, "order", published, pcep_topic)
SELECT id, title, description, "order", published, pcep_topic
FROM json_to_recordset(${jsonBlock(lessons)}) AS x(
  id text, title text, description text, "order" int, published boolean, pcep_topic text
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  "order" = EXCLUDED."order",
  published = EXCLUDED.published,
  pcep_topic = EXCLUDED.pcep_topic;

INSERT INTO pcep_flashcards (
  id, lesson_id, "order", question, tip, tip2_messages, tip3_messages,
  answer, detail, code_example, learn_more_url, learn_more_label
)
SELECT
  id, lesson_id, "order", question, tip, tip2_messages, tip3_messages,
  answer, detail, code_example, learn_more_url, learn_more_label
FROM json_to_recordset(${jsonBlock(cards)}) AS x(
  id text, lesson_id text, "order" int, question text, tip text,
  tip2_messages jsonb, tip3_messages jsonb, answer text, detail text,
  code_example text, learn_more_url text, learn_more_label text
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  "order" = EXCLUDED."order",
  question = EXCLUDED.question,
  tip = EXCLUDED.tip,
  tip2_messages = EXCLUDED.tip2_messages,
  tip3_messages = EXCLUDED.tip3_messages,
  answer = EXCLUDED.answer,
  detail = EXCLUDED.detail,
  code_example = EXCLUDED.code_example,
  learn_more_url = EXCLUDED.learn_more_url,
  learn_more_label = EXCLUDED.learn_more_label;

INSERT INTO pcep_exercises (
  id, lesson_id, "order", title, task, solution, notes, starter_code, solution_code
)
SELECT id, lesson_id, "order", title, task, solution, notes, starter_code, solution_code
FROM json_to_recordset(${jsonBlock(exercises)}) AS x(
  id text, lesson_id text, "order" int, title text, task text, solution text,
  notes text, starter_code text, solution_code text
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  "order" = EXCLUDED."order",
  title = EXCLUDED.title,
  task = EXCLUDED.task,
  solution = EXCLUDED.solution,
  notes = EXCLUDED.notes,
  starter_code = EXCLUDED.starter_code,
  solution_code = EXCLUDED.solution_code;

INSERT INTO pcep_site_progress (id, learner_name, onboarded, updated_at)
VALUES (
  'default',
  ${sqlString(progress.learnerName ?? "")},
  ${progress.onboarded ?? false},
  ${sqlString(progress.updatedAt ?? new Date().toISOString())}
)
ON CONFLICT (id) DO UPDATE SET
  learner_name = EXCLUDED.learner_name,
  onboarded = EXCLUDED.onboarded,
  updated_at = EXCLUDED.updated_at;
`;

const outPath = process.argv[2];
if (outPath) {
  writeFileSync(outPath, sql, "utf8");
} else {
  process.stdout.write(sql);
}
