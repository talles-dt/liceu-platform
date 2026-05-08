import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (body.confirm !== true) {
    return NextResponse.json(
      { error: "Confirmation required. Send { confirm: true } in the request body." },
      { status: 400 },
    );
  }

  const userId = user.id;
  const admin = createSupabaseAdminClient();

  // Delete all user-associated data in order (respecting foreign key constraints)
  const { error: flashcardError } = await admin
    .from("flashcard_reviews")
    .delete()
    .eq("user_id", userId);
  if (flashcardError) {
    return NextResponse.json({ error: "Failed to delete flashcard reviews", details: flashcardError.message }, { status: 500 });
  }

  const { error: quizError } = await admin
    .from("quiz_attempts")
    .delete()
    .eq("user_id", userId);
  if (quizError) {
    return NextResponse.json({ error: "Failed to delete quiz attempts", details: quizError.message }, { status: 500 });
  }

  const { error: submissionError } = await admin
    .from("assignment_submissions")
    .delete()
    .eq("user_id", userId);
  if (submissionError) {
    return NextResponse.json({ error: "Failed to delete assignment submissions", details: submissionError.message }, { status: 500 });
  }

  const { error: progressError } = await admin
    .from("module_progress")
    .delete()
    .eq("user_id", userId);
  if (progressError) {
    return NextResponse.json({ error: "Failed to delete module progress", details: progressError.message }, { status: 500 });
  }

  const { error: purchaseError } = await admin
    .from("purchases")
    .delete()
    .eq("user_id", userId);
  if (purchaseError) {
    return NextResponse.json({ error: "Failed to delete purchases", details: purchaseError.message }, { status: 500 });
  }

  const { error: mentoringError } = await admin
    .from("mentoring_applications")
    .delete()
    .eq("email", user.email);
  if (mentoringError) {
    return NextResponse.json({ error: "Failed to delete mentoring applications", details: mentoringError.message }, { status: 500 });
  }

  const { error: userError } = await admin
    .from("users")
    .delete()
    .eq("id", userId);
  if (userError) {
    return NextResponse.json({ error: "Failed to delete user record", details: userError.message }, { status: 500 });
  }

  // Delete the auth user
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: "Failed to delete auth user", details: authError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Account and all associated data deleted",
  });
}
