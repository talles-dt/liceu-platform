import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";
import { markLiceuLessonComplete, canAccessLiceuModuleForUser } from "@/lib/progression";
export async function POST(_request: Request, { params }: { params: Promise<{ moduleId: string; lessonId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { moduleId, lessonId } = await params;
  if (!await canAccessLiceuModuleForUser(user.id,moduleId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { data: lesson } = await db.from("liceu_lessons").select("id").eq("id",lessonId).eq("module_id",moduleId).eq("is_published",true).maybeSingle();
  if (!lesson) return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 });
  if (!await markLiceuLessonComplete(user.id,lessonId)) return NextResponse.json({ error: "Não foi possível salvar. Tente novamente." }, { status: 500 });
  return NextResponse.json({ success: true, lessonId });
}
