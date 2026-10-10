import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
export async function POST(_request: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { moduleId } = await params;
  const { error } = await createSupabaseAdminClient().rpc("liceu_complete_module", { p_user: user.id, p_module: moduleId });
  if (error) return NextResponse.json({ error: "Conclua todas as lições e alcance 70% no quiz para avançar." }, { status: 409 });
  return NextResponse.json({ success: true, moduleId });
}
