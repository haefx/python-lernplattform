-- Labyrinth-Orden im Lernmonitor: abgeschlossene Level pro Nutzer

ALTER TABLE pcep_learners
  ADD COLUMN IF NOT EXISTS maze_completed_levels JSONB NOT NULL DEFAULT '[]'::jsonb;
