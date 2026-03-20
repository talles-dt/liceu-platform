import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ moduleId: string }> };

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const body = (await req.json().catch(() => ({}))) as { content?: string };

  if (!body.content?.trim() || body.content.trim().length < 30) {
    return NextResponse.json(
      { error: "content must be at least 30 characters" },
      { status: 400 },
    );
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
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, status: data.status });
}

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
    .eq("kind", "micro_speech")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; content: string; status: string; created_at: string }>();

  return NextResponse.json({ submission: data ?? null });
}
