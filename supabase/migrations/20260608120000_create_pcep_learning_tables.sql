-- PCEP Lernplattform (isoliert von anderen Tabellen im gleichen Projekt)

CREATE TABLE pcep_lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  pcep_topic TEXT
);

CREATE TABLE pcep_flashcards (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES pcep_lessons(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  question TEXT NOT NULL,
  tip TEXT NOT NULL DEFAULT '',
  tip2_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  tip3_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer TEXT NOT NULL,
  detail TEXT,
  code_example TEXT,
  learn_more_url TEXT,
  learn_more_label TEXT
);

CREATE TABLE pcep_exercises (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES pcep_lessons(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  task TEXT NOT NULL,
  solution TEXT NOT NULL,
  notes TEXT,
  starter_code TEXT,
  solution_code TEXT
);

CREATE TABLE pcep_site_progress (
  id TEXT PRIMARY KEY DEFAULT 'default',
  learner_name TEXT NOT NULL DEFAULT '',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pcep_lesson_progress (
  lesson_id TEXT PRIMARY KEY REFERENCES pcep_lessons(id) ON DELETE CASCADE,
  completed_card_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_exercise_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  lesson_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ
);

CREATE INDEX pcep_flashcards_lesson_id_idx ON pcep_flashcards(lesson_id);
CREATE INDEX pcep_exercises_lesson_id_idx ON pcep_exercises(lesson_id);

ALTER TABLE pcep_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcep_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcep_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcep_site_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcep_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY pcep_lessons_public_read ON pcep_lessons
  FOR SELECT USING (published = true);

CREATE POLICY pcep_flashcards_public_read ON pcep_flashcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pcep_lessons l
      WHERE l.id = lesson_id AND l.published = true
    )
  );

CREATE POLICY pcep_exercises_public_read ON pcep_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pcep_lessons l
      WHERE l.id = lesson_id AND l.published = true
    )
  );
