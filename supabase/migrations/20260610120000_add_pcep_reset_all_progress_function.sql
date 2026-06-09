CREATE OR REPLACE FUNCTION public.pcep_reset_all_progress()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reset_at timestamptz := now();
BEGIN
  DELETE FROM pcep_learners;

  DELETE FROM pcep_lesson_progress;

  INSERT INTO pcep_site_progress (
    id,
    learner_name,
    onboarded,
    updated_at,
    progress_reset_at
  )
  VALUES ('default', '', false, reset_at, reset_at)
  ON CONFLICT (id) DO UPDATE SET
    learner_name = EXCLUDED.learner_name,
    onboarded = EXCLUDED.onboarded,
    updated_at = EXCLUDED.updated_at,
    progress_reset_at = EXCLUDED.progress_reset_at;

  RETURN reset_at;
END;
$$;

REVOKE ALL ON FUNCTION public.pcep_reset_all_progress() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pcep_reset_all_progress() TO service_role;
