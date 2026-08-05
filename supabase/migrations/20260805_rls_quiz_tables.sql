-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies for quiz tables
-- These tables were missing read policies for authenticated users, causing
-- the quiz API to return empty results (the anon key couldn't read rows).
-- ─────────────────────────────────────────────────────────────────────────────

-- quizzes: allow authenticated users to read (curriculum data, not user-specific)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quizzes_public_read" ON public.quizzes;
CREATE POLICY "quizzes_public_read" ON public.quizzes
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- quiz_questions: allow authenticated users to read (curriculum data)
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_questions_public_read" ON public.quiz_questions;
CREATE POLICY "quiz_questions_public_read" ON public.quiz_questions
  FOR ALL
  USING (auth.uid() IS NOT NULL);
