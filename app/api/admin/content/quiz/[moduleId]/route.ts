import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/admin/auth";

type Context = { params: Promise<{ moduleId: string }> };

/**
 * Resolves quiz_id for a module, creating a quiz row if one doesn't exist yet.
 */
async function resolveQuizId(moduleId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("module_id", moduleId)
    .maybeSingle<{ id: string }>();

  if (existing) return existing.id;

  // Auto-create a quiz for this module
  const { data: created, error } = await supabase
    .from("quizzes")
    .insert({ module_id: moduleId })
    .select("id")
    .single<{ id: string }>();

  if (error) return null;
  return created.id;
}

/** GET — all questions for a module */
export async function GET(_req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { moduleId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("module_id", moduleId)
    .maybeSingle<{ id: string }>();

  if (!quiz) return NextResponse.json({ questions: [] });

  const { data, error } = await supabase
    .from("quiz_questions")
    .select("id, question, options, correct_answer")
    .eq("quiz_id", quiz.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Normalize to the shape ContentEditor expects
  const questions = (data ?? []).map((q: {
    id: string;
    question: string;
    options: { id: string; label: string }[];
    correct_answer: string;
  }) => ({
    id: q.id,
    prompt: q.question,
    options: q.options,
    correct_option_id: q.correct_answer,
    order_index: 0,
  }));

  return NextResponse.json({ questions });
}

/** POST — add a question */
export async function POST(req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { moduleId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    options?: { id: string; label: string }[];
    correct_option_id?: string;
  };

  if (!body.prompt || !body.options || body.options.length < 2 || !body.correct_option_id)
    return NextResponse.json({ error: "prompt, options (min 2) and correct_option_id required" }, { status: 400 });

  const quizId = await resolveQuizId(moduleId);
  if (!quizId) return NextResponse.json({ error: "Could not resolve quiz" }, { status: 500 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("quiz_questions")
    .insert({
      quiz_id: quizId,
      question: body.prompt,
      options: body.options,
      correct_answer: body.correct_option_id,
    })
    .select("id, question, options, correct_answer")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return in the shape ContentEditor expects
  return NextResponse.json({
    question: {
      id: (data as { id: string }).id,
      prompt: (data as { question: string }).question,
      options: (data as { options: { id: string; label: string }[] }).options,
      correct_option_id: (data as { correct_answer: string }).correct_answer,
      order_index: 0,
    },
  });
}

/** DELETE — remove a question */
export async function DELETE(req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { question_id?: string };
  if (!body.question_id) return NextResponse.json({ error: "question_id required" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", body.question_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
