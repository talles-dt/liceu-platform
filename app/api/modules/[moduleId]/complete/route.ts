import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { canAccessLiceuModuleForUser } from "@/lib/progression";

type Context = {
  params: Promise<{
    moduleId: string;
  }>;
};

export async function POST(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { moduleId } = await params;
  const supabase = await createSupabaseServerClient();

  // Check access using Liceu tables
  const canAccess = await canAccessLiceuModuleForUser(user.id, moduleId);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if all lessons in this module are completed
  const { data: lessons } = await supabase
    .from("liceu_lessons")
    .select("id")
    .eq("module_id", moduleId)
    .eq("is_published", true);

  if (!lessons || lessons.length === 0) {
    return NextResponse.json(
      { error: "No lessons in this module" },
      { status: 400 }
    );
  }

  const lessonIds = lessons.map((l) => l.id);

  const { data: progression } = await supabase
    .from("liceu_learner_progression")
    .select("completed_lessons")
    .eq("user_id", user.id)
    .maybeSingle<{ completed_lessons: string[] }>();

  const completedLessons = new Set(progression?.completed_lessons ?? []);
  const allLessonsCompleted = lessonIds.every((id) => completedLessons.has(id));

  if (!allLessonsCompleted) {
    return NextResponse.json(
      { error: "Not all lessons completed" },
      { status: 400 }
    );
  }

  // Mark module as "completed" by updating current_module_id
  const { error } = await supabase
    .from("liceu_learner_progression")
    .upsert(
      {
        user_id: user.id,
        current_module_id: moduleId,
        completed_lessons: lessonIds,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, moduleId });
}