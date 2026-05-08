import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sendAssignmentFeedbackEmail } from "@/lib/email/assignmentFeedback";

/**
 * PATCH /api/admin/assignments/[submissionId]
 *
 * Updates the status of an assignment submission and notifies the student via email.
 * Body: { status: "approved" | "revision" | "rejected", reviewer_notes?: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { submissionId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    status?: "approved" | "revision" | "rejected";
    reviewer_notes?: string;
  };

  if (!body.status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Get the submission
  const { data: submission, error: fetchError } = await supabase
    .from("assignment_submissions")
    .select("id, user_id, module_id, content, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const sub = submission as unknown as {
    user_id: string;
    module_id: string;
    status: string | null;
  };

  // Update the submission
  const { error: updateError } = await supabase
    .from("assignment_submissions")
    .update({
      status: body.status,
      reviewer_notes: body.reviewer_notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) {
    console.error("[admin/assignments] update failed", updateError);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  // Get student info
  const { data: userRow } = await supabase
    .from("users")
    .select("email, name")
    .eq("id", sub.user_id)
    .maybeSingle();

  const student = userRow as unknown as { email?: string | null; name?: string | null } | null;
  const studentEmail = student?.email;
  const studentName = student?.name ?? studentEmail?.split("@")[0] ?? "Estudante";

  // Get module name
  const { data: moduleRow } = await supabase
    .from("modules")
    .select("title")
    .eq("id", sub.module_id)
    .maybeSingle();

  const moduleName = (moduleRow as unknown as { title?: string } | null)?.title ?? "Módulo";

  // Send feedback email
  if (studentEmail) {
    await sendAssignmentFeedbackEmail(
      studentEmail,
      studentName,
      moduleName,
      body.status,
      body.reviewer_notes,
    ).catch((e) => console.error("[admin/assignments] feedback email failed", e));
  }

  return NextResponse.json({ ok: true, status: body.status });
}
