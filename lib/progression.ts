import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  isModuleCompleted,
  canUnlockMentorship,
  type Lesson,
  type LessonCompletion,
  type ModuleProgress,
} from "@/lib/domain";

type DbModuleRow = {
  id: string;
  course_id: string;
  order_index: number;
};

type DbModuleProgressRow = {
  user_id: string;
  module_id: string;
  completed: boolean;
  quiz_score: number | null;
  assignment_submitted: boolean;
  mentorship_unlocked: boolean;
};

type DbLessonRow = {
  id: string;
  module_id: string;
  order_index: number;
  title: string;
};

type DbLessonCompletionRow = {
  user_id: string;
  lesson_id: string;
  completed: boolean;
};

/**
 * Check if a user can access a given module for study/mentorship scheduling.
 *
 * Rules:
 * - First module in a course is always accessible.
 * - ALL previous modules must be completed (quiz >= 70 + assignment approved).
 *
 * This matches the domain.ts canAccessModule logic. Checking only the
 * immediately-previous module is insufficient: a gap anywhere in the chain
 * would be invisible.
 */
export async function canAccessModuleForUser(
  userId: string,
  moduleId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  // Load target module
  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .select("id, course_id, order_index")
    .eq("id", moduleId)
    .maybeSingle<DbModuleRow>();

  if (moduleError || !module) return false;

  // First module is always accessible
  if (module.order_index === 0) return true;

  // Load ALL modules in the same course that come before this one
  const { data: previousModules, error: prevError } = await supabase
    .from("modules")
    .select("id, course_id, order_index")
    .eq("course_id", module.course_id)
    .lt("order_index", module.order_index)
    .order("order_index", { ascending: true });

  if (prevError || !previousModules || previousModules.length === 0) {
    return false;
  }

  const previousIds = (previousModules as DbModuleRow[]).map((m) => m.id);

  // Load progress rows for all previous modules in one query
  const { data: progressRows, error: progressError } = await supabase
    .from("module_progress")
    .select(
      "user_id, module_id, completed, quiz_score, assignment_submitted, mentorship_unlocked",
    )
    .eq("user_id", userId)
    .in("module_id", previousIds);

  if (progressError) return false;

  const progressByModule = new Map(
    (progressRows as DbModuleProgressRow[]).map((p) => [p.module_id, p]),
  );

  // Every previous module must be fully completed
  return (previousModules as DbModuleRow[]).every((m) => {
    const p = progressByModule.get(m.id);
    if (!p) return false;
    if (!p.completed) return false;
    if (p.quiz_score === null || p.quiz_score < 70) return false;
    if (!p.assignment_submitted) return false;
    return true;
  });
}

/**
 * Mark a module as completed for a user, if all conditions are satisfied.
 *
 * Rules:
 * - Previous module (if any) must be completed (same criteria as canAccessModuleForUser).
 * - Current module is completed only if:
 *   - all lessons in the module are completed by the user
 *   - quiz score >= 70
 *   - assignment is approved
 */
export async function completeModuleForUser(
  userId: string,
  moduleId: string,
): Promise<ModuleProgress | null> {
  const supabase = await createSupabaseServerClient();

  // Ensure access based on previous module completion
  const canAccess = await canAccessModuleForUser(userId, moduleId);
  if (!canAccess) {
    return null;
  }

  // Load lessons for this module
  const { data: lessonRows, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, module_id, order_index, title")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: true });

  if (lessonsError) {
    return null;
  }

  const lessons: Lesson[] =
    lessonRows?.map((l: DbLessonRow) => ({
      id: l.id,
      moduleId: l.module_id,
      index: l.order_index,
      title: l.title,
    })) ?? [];

  // Load lesson completion for the user
  const { data: lessonCompletionRows, error: lessonCompletionError } =
    await supabase
      .from("lesson_completions")
      .select("user_id, lesson_id, completed")
      .eq("user_id", userId)
      .in(
        "lesson_id",
        lessons.map((l) => l.id),
      );

  if (lessonCompletionError) {
    return null;
  }

  const lessonCompletions: LessonCompletion[] =
    lessonCompletionRows?.map((lc: DbLessonCompletionRow) => ({
      lessonId: lc.lesson_id,
      completed: lc.completed,
    })) ?? [];

  // Load existing module progress (for quiz score + assignment)
  const { data: moduleProgressRow, error: moduleProgressError } = await supabase
    .from("module_progress")
    .select(
      "user_id, module_id, completed, quiz_score, assignment_submitted, mentorship_unlocked",
    )
    .eq("user_id", userId)
    .eq("module_id", moduleId)
    .maybeSingle<DbModuleProgressRow>();

  if (moduleProgressError || !moduleProgressRow) {
    return null;
  }

  const moduleIsCompleted = isModuleCompleted({
    moduleId,
    lessons,
    lessonCompletions,
    quizScore: moduleProgressRow.quiz_score,
    assignmentApproved: moduleProgressRow.assignment_submitted,
  });

  if (!moduleIsCompleted) {
    return null;
  }

  const candidateProgress: ModuleProgress = {
    moduleId,
    completed: true,
    quizScore: moduleProgressRow.quiz_score,
    assignmentApproved: moduleProgressRow.assignment_submitted,
    mentorshipUnlocked: moduleProgressRow.mentorship_unlocked,
  };

  const shouldUnlockMentorship = canUnlockMentorship(candidateProgress);

  const { data: updated, error: updateError } = await supabase
    .from("module_progress")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      mentorship_unlocked: shouldUnlockMentorship
        ? true
        : moduleProgressRow.mentorship_unlocked,
    })
    .eq("user_id", userId)
    .eq("module_id", moduleId)
    .select(
      "module_id, completed, quiz_score, assignment_submitted, mentorship_unlocked",
    )
    .maybeSingle<DbModuleProgressRow>();

  if (updateError || !updated) {
    return null;
  }

  const result: ModuleProgress = {
    moduleId: updated.module_id,
    completed: updated.completed,
    quizScore: updated.quiz_score,
    assignmentApproved: updated.assignment_submitted,
    mentorshipUnlocked: updated.mentorship_unlocked,
  };

  return result;
}

/**
 * Provision `module_progress` rows for a user after purchasing a course.
 *
 * Intended usage: call this from your payment webhook / purchase handler once
 * you have (userId, courseId).
 *
 * Idempotent: safe to call multiple times.
 */
export async function ensureCourseProgressForUser(
  userId: string,
  courseId: string,
): Promise<{ createdOrUpdated: number }> {
  const supabase = await createSupabaseServerClient();

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  if (modulesError) {
    return { createdOrUpdated: 0 };
  }

  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
  if (moduleIds.length === 0) return { createdOrUpdated: 0 };

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
    return { createdOrUpdated: 0 };
  }

  return { createdOrUpdated: rows.length };
}

