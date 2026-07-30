import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = {
  params: Promise<{
    moduleId: string;
    lessonId: string;
  }>;
};

export async function POST(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { moduleId, lessonId } = await params;
  const supabase = await createSupabaseServerClient();

  // Verify the lesson belongs to the module
  const { data: lesson } = await supabase
    .from("liceu_lessons")
    .select("id, module_id")
    .eq("id", lessonId)
    .eq("module_id", moduleId)
    .maybeSingle<{ id: string; module_id: string }>();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found in this module" }, { status: 404 });
  }

  // Mark lesson as complete
  const { data: prog } = await supabase
    .from("liceu_learner_progression")
    .select("completed_lessons")
    .eq("user_id", user.id)
    .maybeSingle<{ completed_lessons?: string[] }>();

  const currentCompleted = new Set((prog?.completed_lessons ?? []) as string[]);
  if (!currentCompleted.has(lessonId)) {
    currentCompleted.add(lessonId);
  }

  const completedLessons = Array.from(currentCompleted);

  const { error } = await supabase
    .from("liceu_learner_progression")
    .upsert(
      {
        user_id: user.id,
        completed_lessons: completedLessons,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, lessonId, completed: completedLessons.length });
}
