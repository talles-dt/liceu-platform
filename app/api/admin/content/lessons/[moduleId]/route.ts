import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/admin/auth";

type Context = { params: Promise<{ moduleId: string }> };

/** GET — all lessons for a module with content and stream ID */
export async function GET(_req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { moduleId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, content, cloudflare_stream_id, order_index")
    .eq("module_id", moduleId)
    .order("order_index");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lessons: data ?? [] });
}

/** POST — upsert lesson content and/or video ID */
export async function POST(req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { moduleId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    lesson_id: string;
    content?: string;
    cloudflare_stream_id?: string;
  };

  if (!body.lesson_id)
    return NextResponse.json({ error: "lesson_id required" }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  const updates: Record<string, string | null> = {};
  if (body.content !== undefined) updates.content = body.content;
  if (body.cloudflare_stream_id !== undefined)
    updates.cloudflare_stream_id = body.cloudflare_stream_id || null;

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", body.lesson_id)
    .eq("module_id", moduleId)
    .select("id, title, content, cloudflare_stream_id, order_index")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}
