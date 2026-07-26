import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";
import { PurchaseToast } from "@/components/PurchaseToast";

export const revalidate = 60;

type DashboardSearchParams = {
  purchase?: string;
};

type DbModuleRow = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  is_active: boolean;
};

type DbLessonRow = {
  id: string;
  module_id: string;
  code: string;
  title: string;
  subtitle: string;
  learning_objective: string;
  rhetorical_dimension: string;
  archetype_keys: string[];
  difficulty_tier: number;
  estimated_minutes: number;
  prerequisites: string[];
  order_index: number;
  is_published: boolean;
};

type DbProgressionRow = {
  user_id: string;
  current_module_id: string | null;
  current_lesson_id: string | null;
  completed_lessons: string[];
  completed_exercises: string[];
  completed_simulations: string[];
  flashcard_review_streak: number;
  last_flashcard_review_at: string | null;
  diagnostic_archetype_keys: string[];
  diagnostic_dimension_scores: unknown;
  maturity_stage: string;
  total_study_minutes: number;
};

type ModuleStatus = "completed" | "current" | "locked";

const statusTone: Record<ModuleStatus, string> = {
  completed: "bg-green-900/30 text-green-400 border-green-800",
  current: "bg-amber-900/30 text-amber-400 border-amber-800",
  locked: "bg-slate-700/50 text-slate-400 border-slate-600",
};

const statusLabel: Record<ModuleStatus, string> = {
  completed: "Completed",
  current: "Active",
  locked: "Locked",
};

async function canAccessLiceuModuleForUser(
  userId: string,
  moduleId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data: module, error: moduleError } = await supabase
    .from("liceu_modules")
    .select("id, code, order_index")
    .eq("id", moduleId)
    .maybeSingle();

  if (moduleError || !module) return false;

  if (module.order_index === 0) return true;

  const { data: previousModules, error: prevError } = await supabase
    .from("liceu_modules")
    .select("id, code, order_index")
    .eq("is_active", true)
    .lt("order_index", module.order_index)
    .order("order_index", { ascending: true });

  if (prevError || !previousModules || previousModules.length === 0) {
    return false;
  }

  const previousIds = previousModules.map((m) => m.id);

  const { data: progRow, error: progressError } = await supabase
    .from("liceu_learner_progression")
    .select("completed_lessons, current_module_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (progressError) return false;

  const completedLessonIds = progRow?.completed_lessons ?? [];

  const { data: prevModuleLessons } = await supabase
    .from("liceu_lessons")
    .select("id")
    .in("module_id", previousIds);

  const prevModuleLessonIds = new Set((prevModuleLessons ?? []).map(l => l.id));

  return completedLessonIds.some((id: string) => prevModuleLessonIds.has(id));
}

async function initLiceuProgression(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

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
      maturity_stage: "novato",
      total_study_minutes: 0,
    }, {
      onConflict: "user_id",
      ignoreDuplicates: true,
    });

  return !error;
}

async function loadDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient();

  await initLiceuProgression(userId);

  const { data: progressionData } = await supabase
    .from("liceu_learner_progression")
    .select("*")
    .eq("user_id", userId)
    .single();

  const progression = progressionData as any;

  const { data: modulesData } = await supabase
    .from("liceu_modules")
    .select("id, code, title, subtitle, description, order_index, estimated_hours, is_active")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  const modules = (modulesData as any[]) ?? [];

  const { data: lessonsData } = await supabase
    .from("liceu_lessons")
    .select("id, module_id, code, title, subtitle, learning_objective, rhetorical_dimension, archetype_keys, difficulty_tier, estimated_minutes, prerequisites, order_index, is_published")
    .eq("is_published", true)
    .order("module_id")
    .order("order_index", { ascending: true });

  const lessons = (lessonsData as any[]) ?? [];

  // Pre-compute access for all modules
  const moduleAccess = await Promise.all(
    modules
      .filter(m => m.is_active)
      .map(async (m) => {
        const canAccess = await canAccessLiceuModuleForUser(userId, m.id);
        return { moduleId: m.id, canAccess };
      })
  );

  const accessMap = new Map(moduleAccess.map(a => [a.moduleId, a.canAccess]));

  const moduleItems = modules
    .filter(m => m.is_active)
    .map(m => {
      const moduleLessons = lessons.filter(l => l.module_id === m.id);
      const completedCount = lessons.filter(l => 
        l.module_id === m.id && 
        progression?.completed_lessons?.includes(l.id)
      ).length ?? 0;
      const totalCount = moduleLessons.length;
      const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

      const isCurrentModule = progression?.current_module_id === m.id;
      const isCompleted = completedCount === totalCount && totalCount > 0;
      const canAccess = accessMap.get(m.id) ?? false;
      
      let status: ModuleStatus = "locked";
      if (isCompleted) status = "completed";
      else if (isCurrentModule || canAccess) status = "current";

      return {
        id: m.id,
        title: `${m.code} — ${m.title}`,
        subtitle: m.subtitle,
        href: `/modules/${m.id}`,
        status,
        progress: { completed: completedCount, total: totalCount, percent },
      };
    });

  return { modules: moduleItems, progression };
}

function ModuleList({ items }: { items: { id: string; title: string; subtitle?: string; href: string; status: ModuleStatus; progress: { completed: number; total: number; percent: number } }[] }) {
  return (
    <ol className="space-y-3">
      {items.map((m) => {
        const isLocked = m.status === "locked";

        const inner = (
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="font-[var(--font-work-sans)] text-sm tracking-tight text-[var(--liceu-text)]">
                {m.title}
              </div>
              {m.subtitle && (
                <div className="mt-1 text-xs text-[var(--liceu-muted)] line-clamp-2">
                  {m.subtitle}
                </div>
              )}
              {m.progress && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--liceu-muted)]">
                  <span>{m.progress.completed}/{m.progress.total}</span>
                  <div className="h-1.5 flex-1 bg-[var(--liceu-surface-container-highest)] rounded overflow-hidden">
                    <div
                      className="h-full bg-[var(--liceu-accent)] transition-all duration-500"
                      style={{ width: `${m.progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div
              className={[
                "shrink-0 border px-2 py-0.5",
                "font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em]",
                statusTone[m.status],
              ].join(" ")}
            >
              {statusLabel[m.status]}
            </div>
          </div>
        );

        return (
          <li key={m.id}>
            {m.status === "locked" ? (
              <div className={[
                "group relative rounded border p-4 flex items-start justify-between gap-6",
                "hover:bg-[var(--liceu-surface-container-high)] transition-colors",
                statusTone[m.status],
              ].join(" ")}>{inner}</div>
            ) : (
              <a href={m.href as `/modules/${string}`} className={[
                "group relative rounded border p-4 flex items-start justify-between gap-6",
                "hover:bg-[var(--liceu-surface-container-high)] transition-colors",
                statusTone[m.status],
              ].join(" ")}>{inner}</a>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await (await createSupabaseServerClient())
    .from("users")
    .select("id, name, email, role")
    .eq("id", user.id)
    .single();

  const { modules, progression } = await loadDashboardData(user.id);

  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="font-[var(--font-space-grotesk)] text-3xl tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-[var(--liceu-muted)]">
            {profile?.name || "Student"} — Liceu Underground
          </p>
        </header>

        <section aria-label="Modules">
          <h2 className="font-[var(--font-work-sans)] text-lg tracking-tight mb-4">
            Your Curriculum
          </h2>
          <ModuleList items={modules} />
        </section>

        {searchParams.purchase && (
          <PurchaseToast />
        )}
      </div>
    </div>
  );
}