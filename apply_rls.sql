ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quizzes_public_read" ON public.quizzes;
CREATE POLICY "quizzes_public_read" ON public.quizzes
  FOR ALL
  USING (auth.uid() IS NOT NULL);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_questions_public_read" ON public.quiz_questions;
CREATE POLICY "quiz_questions_public_read" ON public.quiz_questions
  FOR ALL
  USING (auth.uid() IS NOT NULL);
