-- Highscore pro Level: wenigste „Ausführen“-Klicks gewinnt (pro Besucher ein Bestwert)

CREATE TABLE pcep_maze_scores (
  visitor_id TEXT NOT NULL,
  level_id INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  execute_count INTEGER NOT NULL CHECK (execute_count > 0),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, level_id)
);

CREATE INDEX pcep_maze_scores_level_execute_idx
  ON pcep_maze_scores (level_id, execute_count ASC, achieved_at ASC);

ALTER TABLE pcep_maze_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY pcep_maze_scores_public_read ON pcep_maze_scores
  FOR SELECT USING (display_name <> '');
