import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type AccessLevel = "none" | "ebook" | "video" | "mentoring";

/**
 * Returns the highest access level a user has for a given course.
 * none → redirect to /programa
 * ebook → text only
 * video → text + video
 * mentoring → text + video (same as video, sessions unlock separately)
 */
export async function getUserAccessLevel(
  userId: string,
  courseId: string,
): Promise<AccessLevel> {
  if (!courseId) return "none";

  const supabase = await createSupabaseServerClient();

  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
  if (moduleIds.length === 0) return "none";

  const { data: progress } = await supabase
    .from("module_progress")
    .select("module_id")
    .eq("user_id", userId)
    .in("module_id", moduleIds)
    .limit(1);

  // If user has any progress rows for this course, they have at least ebook access.
  // To distinguish ebook vs video, check the purchases table by kind.
  if (!progress || progress.length === 0) return "none";

  const { data: purchases } = await supabase
    .from("purchases")
    .select("kind")
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (!purchases || purchases.length === 0) return "none";

  const kinds = new Set(purchases.map((p: { kind: string }) => p.kind));

  if (kinds.has("mentoring_program")) return "mentoring";
  if (kinds.has("video")) return "video";
  if (kinds.has("ebook")) return "ebook";

  return "none";
}
