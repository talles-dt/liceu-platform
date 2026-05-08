import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ moduleId: string }> };

/**
 * POST /api/modules/[moduleId]/start
 * Sets started_at on module_progress if not already set.
 * Called when the student first opens the module page.
 */
export async function POST(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const supabase = await createSupabaseServerClient();

  // Only set started_at if it's null — never overwrite
  await supabase
    .from("module_progress")
    .update({ started_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .is("started_at", null);

  return NextResponse.json({ ok: true });
}
