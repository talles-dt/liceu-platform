import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type DbModuleRow = {
  id: string;
  code: string;
  order_index: number;
};

type DbModuleProgressRow = {
  user_id: string;
  current_module_id: string | null;
  current_lesson_id: string | null;
  completed_lessons: string[];
  completed_exercises: string[];
  completed_simulations: string[];
  flashcard_review_streak: number;
  last_flashcard_review_at: string | null;
  diagnostic_archetype_keys: string[];
  diagnostic_dimension_scores: Record<string, number>;
  maturity_stage: string;
  total_study_minutes: number;
};

/**
 * Check if a user can access a given Liceu module for study.
 *
 * Rules:
 * - First module (order_index === 0) is always accessible.
 * - Subsequent modules require user to have completed at least one lesson from previous module.
 * - Uses liceu_learner_progression table for progress tracking.
 */
export async function canAccessLiceuModuleForUser(
  userId: string,
  moduleId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("liceu_can_access_module", { p_module_id: moduleId });
  const { data: { user } } = await supabase.auth.getUser();
  return !error && user?.id === userId && data === true;
}

/**
 * Update a user's lesson completion in liceu_learner_progression.
 * This is called when a user completes a lesson.
 */
export async function markLiceuLessonComplete(
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const { error } = await createSupabaseAdminClient().rpc("liceu_complete_lesson", { p_user: userId, p_lesson: lessonId });
  return !error;
}

/**
 * Update a user's exercise completion in liceu_learner_progression.
 */
export async function markLiceuExerciseComplete(
  userId: string,
  exerciseId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("liceu_learner_progression")
    .select("completed_exercises")
    .eq("user_id", userId)
    .maybeSingle<DbModuleProgressRow>();

  if (fetchError) return false;

  const completedExercises = new Set(existing?.completed_exercises ?? []);
  completedExercises.add(exerciseId);

  const { error: updateError } = await supabase
    .from("liceu_learner_progression")
    .upsert({
      user_id: userId,
      completed_exercises: Array.from(completedExercises),
    }, {
      onConflict: "user_id",
    });

  return !updateError;
}

/**
 * Update a user's simulation completion in liceu_learner_progression.
 */
export async function markLiceuSimulationComplete(
  userId: string,
  simulationId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("liceu_learner_progression")
    .select("completed_simulations")
    .eq("user_id", userId)
    .maybeSingle<DbModuleProgressRow>();

  if (fetchError) return false;

  const completedSimulations = new Set(existing?.completed_simulations ?? []);
  completedSimulations.add(simulationId);

  const { error: updateError } = await supabase
    .from("liceu_learner_progression")
    .upsert({
      user_id: userId,
      completed_simulations: Array.from(completedSimulations),
    }, {
      onConflict: "user_id",
    });

  return !updateError;
}

/**
 * Initialize a new user's Liceu progression record.
 */
export async function initLiceuProgression(userId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("liceu_learner_progression")
    .upsert({
      user_id: userId,
      current_module_id: null,
      current_lesson_id: null,
      completed_lessons: [],
      completed_exercises: [],
      completed_simulations: [],
      flashcard_review_streak: 0,
      last_flashcard_review_at: null,
      diagnostic_archetype_keys: [],
      diagnostic_dimension_scores: {},
      maturity_stage: "novice",
      total_study_minutes: 0,
    }, {
      onConflict: "user_id",
      ignoreDuplicates: true,
    });

  return !error;
}

/**
 * Get a user's current Liceu progression.
 */
export async function getLiceuProgression(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("liceu_learner_progression")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<DbModuleProgressRow>();

  if (error) return null;
  return data;
}

/**
 * Set current module for a user.
 */
export async function setLiceuCurrentModule(
  userId: string,
  moduleId: string | null,
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("liceu_learner_progression")
    .upsert({
      user_id: userId,
      current_module_id: moduleId,
    }, {
      onConflict: "user_id",
    });

  return !error;
}