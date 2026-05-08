import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";
import { assertModuleAccess } from "@/lib/routeSecurity";

type Context = { params: Promise<{ moduleId: string }> };

type DbAssignment = {
  speech_prompt: string;
};

/**
 * GET — returns the speech prompt + existing submission.
 * POST — submits the micro speech (kind='micro_speech'). Optional, not gating.
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const accessError = await assertModuleAccess(user.id, moduleId);
  if (accessError) return accessError;

  const supabase = await createSupabaseServerClient();

  const [{ data: assignmentRow }, { data: submissionRow }] = await Promise.all([
    supabase
      .from("module_assignments")
      .select("speech_prompt")
      .eq("module_id", moduleId)
      .maybeSingle<DbAssignment>(),
    supabase
      .from("assignment_submissions")
      .select("id, content, status, created_at")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .eq("kind", "micro_speech")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; content: string; status: string; created_at: string }>(),
  ]);

  return NextResponse.json({
    prompt: assignmentRow?.speech_prompt ?? null,
    submission: submissionRow ?? null,
  });
}

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const accessError = await assertModuleAccess(user.id, moduleId);
  if (accessError) return accessError;

  const body = (await req.json().catch(() => ({}))) as { content?: string };

  if (!body.content?.trim() || body.content.trim().length < 30) {
    return NextResponse.json({ error: "Mínimo de 30 caracteres." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("assignment_submissions")
    .insert({
      user_id: user.id,
      module_id: moduleId,
      kind: "micro_speech",
      content: body.content,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, status: data.status });
}
