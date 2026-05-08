import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/admin/auth";

type Context = { params: Promise<{ moduleId: string }> };

/** GET — all flashcard sets for a module, with their cards */
export async function GET(_req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { moduleId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: sets, error } = await supabase
    .from("flashcard_sets")
    .select("id, title, flashcards(id, front, back, order_index)")
    .eq("module_id", moduleId)
    .order("title");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sets: sets ?? [] });
}

/** POST — create a new flashcard set for a module */
export async function POST(req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { moduleId } = await params;
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("flashcard_sets")
    .insert({ module_id: moduleId, title: body.title })
    .select("id, title")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ set: data });
}
