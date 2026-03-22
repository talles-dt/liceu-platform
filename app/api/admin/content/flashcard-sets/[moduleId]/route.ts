import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type Context = { params: Promise<{ moduleId: string }> };

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const envAdmins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const isAdmin = profile?.role === "admin" || (user.email && envAdmins.includes(user.email.toLowerCase()));
  return isAdmin ? user : null;
}

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
