import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

/**
 * Provision `module_progress` rows for a user after purchasing a course.
 *
 * Service-role variant (for Stripe webhooks). Idempotent.
 */
export async function ensureCourseProgressForUserAdmin(
  userId: string,
  courseId: string,
): Promise<{ createdOrUpdated: number }> {
  const supabase = createSupabaseAdminClient();

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  if (modulesError) {
    console.error("[provisioning] Failed to fetch modules for course", courseId, modulesError);
    return { createdOrUpdated: 0 };
  }

  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
  if (moduleIds.length === 0) {
    console.warn("[provisioning] No modules found for course", courseId);
    return { createdOrUpdated: 0 };
  }

  const rows = moduleIds.map((moduleId) => ({
    user_id: userId,
    module_id: moduleId,
    completed: false,
    quiz_score: null,
    assignment_submitted: false,
    mentorship_unlocked: false,
  }));

  const { error: upsertError } = await supabase
    .from("module_progress")
    .upsert(rows, { onConflict: "user_id,module_id" });

  if (upsertError) {
    console.error("[provisioning] Failed to upsert module progress", userId, courseId, upsertError);
    return { createdOrUpdated: 0 };
  }
  return { createdOrUpdated: rows.length };
}

