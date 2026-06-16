-- PCEP-Challenge-Orden im Lernmonitor
ALTER TABLE pcep_learners
  ADD COLUMN IF NOT EXISTS pcep_challenge_completed BOOLEAN NOT NULL DEFAULT false;
