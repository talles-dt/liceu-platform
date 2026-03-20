import { NextResponse } from "next/server";
import type { ModuleProgress } from "@/lib/domain";
import { canUnlockMentorship } from "@/lib/domain";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";

type ProgressPayload = {
  moduleId: string;
  quizScore: number;
  assignmentApproved: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ProgressPayload;

  if (
    !body.moduleId ||
    typeof body.quizScore !== "number" ||
    typeof body.assignmentApproved !== "boolean"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const completed =
    body.quizScore >= 70 && body.assignmentApproved === true;

  const progressRow: ModuleProgress = {
    moduleId: body.moduleId,
    completed,
    quizScore: body.quizScore,
    assignmentApproved: body.assignmentApproved,
    mentorshipUnlocked: false,
  };

  const mentorshipUnlocked = canUnlockMentorship(progressRow);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("module_progress")
    .upsert(
      {
        user_id: user.id,
        module_id: body.moduleId,
        completed,
        quiz_score: body.quizScore,
        assignment_submitted: body.assignmentApproved,
        mentorship_unlocked: mentorshipUnlocked,
      },
      { onConflict: "user_id,module_id" },
    );

  if (error) {
    return NextResponse.json({ error: "Unable to save progress" }, { status: 500 });
  }

  return NextResponse.json({
    completed,
    quizScore: body.quizScore,
    assignmentApproved: body.assignmentApproved,
    mentorshipUnlocked,
  });
}

