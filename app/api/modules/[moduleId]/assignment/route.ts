import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ moduleId: string }> };

/**
 * The main rhetorical exercise — kind='assignment'.
 * This is the one that gates module completion (assignment_submitted flag).
 * Admin approves it via the assignments panel.
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("assignment_submissions")
    .select("id, content, status, created_at")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .eq("kind", "assignment")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; content: string; status: string; created_at: string }>();

  return NextResponse.json({ submission: data ?? null });
}

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const body = (await req.json().catch(() => ({}))) as { content?: string };

  if (!body.content?.trim() || body.content.trim().length < 50) {
    return NextResponse.json(
      { error: "Mínimo de 50 caracteres." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("assignment_submissions")
    .insert({
      user_id: user.id,
      module_id: moduleId,
      kind: "assignment",
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
