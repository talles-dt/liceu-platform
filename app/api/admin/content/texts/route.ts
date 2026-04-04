import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/admin/auth";

/** GET — all module_texts rows */
export async function GET() {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("module_texts")
    .select("id, module_id, title, author, content");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ texts: data ?? [] });
}

/** POST — upsert classical text for a module */
export async function POST(req: Request) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    module_id?: string;
    title?: string;
    author?: string;
    content?: string;
  };

  if (!body.module_id || !body.title || !body.content)
    return NextResponse.json({ error: "module_id, title and content required" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("module_texts")
    .upsert(
      {
        module_id: body.module_id,
        title: body.title,
        author: body.author ?? null,
        content: body.content,
      },
      { onConflict: "module_id" },
    )
    .select("id, module_id, title, author, content")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ text: data });
}
