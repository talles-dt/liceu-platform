import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";

// NOTE: assignmentApproved is intentionally NOT accepted from the client.
// Assignment approval is a server-only action performed by admins via
// /api/admin/assignments/[submissionId]/approve. Accepting it from the
// student-facing body would allow self-approval.
type ProgressPayload = {
  moduleId: string;
  quizScore: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ProgressPayload;

  if (!body.moduleId || typeof body.quizScore !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quizPassed = body.quizScore >= 70;

  const supabase = await createSupabaseServerClient();

  // Read the current assignment_submitted state — we never overwrite it here.
  const { data: existing } = await supabase
    .from("module_progress")
    .select("assignment_submitted")
    .eq("user_id", user.id)
    .eq("module_id", body.moduleId)
    .maybeSingle<{ assignment_submitted: boolean }>();

  const assignmentApproved = existing?.assignment_submitted ?? false;

  const { error } = await supabase
    .from("module_progress")
    .upsert(
      {
        user_id: user.id,
        module_id: body.moduleId,
        quiz_score: body.quizScore,
        // completed is derived server-side; the /complete endpoint is the
        // canonical way to mark a module done once all conditions are met.
      },
      { onConflict: "user_id,module_id" },
    );

  if (error) {
    return NextResponse.json({ error: "Unable to save progress" }, { status: 500 });
  }

  return NextResponse.json({
    quizScore: body.quizScore,
    quizPassed,
    assignmentApproved,
  });
}

