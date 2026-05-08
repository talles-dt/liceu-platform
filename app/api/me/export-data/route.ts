import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const admin = createSupabaseAdminClient();

  const [
    userData,
    progressData,
    submissionsData,
    quizAttemptsData,
    flashcardReviewsData,
    purchasesData,
    mentoringData,
  ] = await Promise.all([
    admin.from("users").select("*").eq("id", userId).single(),
    admin.from("module_progress").select("*").eq("user_id", userId),
    admin.from("assignment_submissions").select("*").eq("user_id", userId),
    admin.from("quiz_attempts").select("*").eq("user_id", userId),
    admin.from("flashcard_reviews").select("*").eq("user_id", userId),
    admin.from("purchases").select("*").eq("user_id", userId),
    admin.from("mentoring_applications").select("*").eq("email", user.email),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: userData.data,
    progress: progressData.data,
    submissions: submissionsData.data,
    quizzes: quizAttemptsData.data,
    flashcards: flashcardReviewsData.data,
    purchases: purchasesData.data,
    mentoring: mentoringData.data,
  });
}
