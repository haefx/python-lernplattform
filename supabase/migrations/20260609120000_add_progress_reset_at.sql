ALTER TABLE pcep_site_progress
  ADD COLUMN IF NOT EXISTS progress_reset_at TIMESTAMPTZ;
