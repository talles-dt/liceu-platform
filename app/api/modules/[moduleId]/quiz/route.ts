import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ moduleId: string }> };

type DbQuestion = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correct_answer: string;
};

/**
 * GET — questions for this module (without revealing correct answers).
 * POST — submit a completed quiz attempt and save the score.
 *
 * Schema: modules → quizzes (module_id) → quiz_questions (quiz_id)
 * Fields: question (not prompt), correct_answer (not correct_option_id)
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const supabase = await createSupabaseServerClient();

  // Resolve quiz_id from module_id
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("module_id", moduleId)
    .maybeSingle<{ id: string }>();

  if (!quiz) return NextResponse.json({ questions: [] });

  const { data, error } = await supabase
    .from("quiz_questions")
    .select("id, question, options")
    .eq("quiz_id", quiz.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map to the shape the quiz page expects — never expose correct_answer
  const questions = (data as Omit<DbQuestion, "correct_answer">[] ?? []).map((q) => ({
    id: q.id,
    prompt: q.question,
    options: q.options,
  }));

  return NextResponse.json({ questions });
}

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    answers?: Record<string, string>; // { questionId: selectedOptionId }
  };

  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Resolve quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("module_id", moduleId)
    .maybeSingle<{ id: string }>();

  if (!quiz) return NextResponse.json({ error: "No quiz for this module" }, { status: 404 });

  // Load correct answers server-side
  const { data, error } = await supabase
    .from("quiz_questions")
    .select("id, correct_answer")
    .eq("quiz_id", quiz.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const questions = (data as { id: string; correct_answer: string }[]) ?? [];
  if (questions.length === 0) {
    return NextResponse.json({ error: "No questions for this module" }, { status: 404 });
  }

  const correct = questions.filter(
    (q) => body.answers![q.id] === q.correct_answer,
  ).length;

  const score = Math.round((correct / questions.length) * 100);

  // Save score to module_progress
  await supabase
    .from("module_progress")
    .upsert(
      { user_id: user.id, module_id: moduleId, quiz_score: score },
      { onConflict: "user_id,module_id" },
    );

  return NextResponse.json({ score, correct, total: questions.length });
}
