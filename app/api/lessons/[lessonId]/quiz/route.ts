import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ lessonId: string }> };

/**
 * GET — lesson quiz questions (no correct answers exposed).
 * POST — submit answers, grade server-side, mark lesson complete if passed.
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("lesson_quiz_questions")
    .select("id, question, options")
    .eq("lesson_id", lessonId)
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const questions = (data ?? []).map((q: {
    id: string;
    question: string;
    options: { id: string; label: string }[];
  }) => ({
    id: q.id,
    prompt: q.question,
    options: q.options,
  }));

  return NextResponse.json({ questions });
}

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    answers?: Record<string, string>;
  };

  if (!body.answers) return NextResponse.json({ error: "answers required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();

  // Load correct answers server-side
  const { data: questions, error } = await supabase
    .from("lesson_quiz_questions")
    .select("id, correct_answer")
    .eq("lesson_id", lessonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!questions || questions.length === 0) {
    // No questions — mark complete automatically
    await markLessonComplete(supabase, user.id, lessonId);
    return NextResponse.json({ score: 100, correct: 0, total: 0, passed: true });
  }

  const correct = questions.filter(
    (q: { id: string; correct_answer: string }) =>
      body.answers![q.id] === q.correct_answer,
  ).length;

  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= 70;

  if (passed) {
    await markLessonComplete(supabase, user.id, lessonId);
  }

  return NextResponse.json({ score, correct, total: questions.length, passed });
}

async function markLessonComplete(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  lessonId: string,
) {
  await supabase
    .from("lesson_completions")
    .upsert(
      { user_id: userId, lesson_id: lessonId, completed: true },
      { onConflict: "user_id,lesson_id" },
    );
}
