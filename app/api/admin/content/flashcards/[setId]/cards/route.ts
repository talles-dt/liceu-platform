import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/admin/auth";

type Context = { params: Promise<{ setId: string }> };

/** POST — add a card to a set */
export async function POST(req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { setId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    front?: string;
    back?: string;
    order_index?: number;
  };

  if (!body.front || !body.back)
    return NextResponse.json({ error: "front and back required" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      set_id: setId,
      front: body.front,
      back: body.back,
      order_index: body.order_index ?? 0,
    })
    .select("id, front, back, order_index")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ card: data });
}

/** DELETE — remove a card */
export async function DELETE(req: Request, { params }: Context) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { card_id?: string };
  if (!body.card_id) return NextResponse.json({ error: "card_id required" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", body.card_id)
    .eq("set_id", (await params).setId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
