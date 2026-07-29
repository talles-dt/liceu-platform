import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type AdminMetrics = {
  activeStudents: number;
  modulesCompletionRate: number;
  totalModules: number;
  totalLessons: number;
  totalTheoreticalContent: number;
  totalFlashcards: number;
  totalExercises: number;
  totalSimulations: number;
  totalExcerpts: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = createSupabaseAdminClient();

  const [
    { count: activeStudents },
    { count: totalModules },
    { count: totalLessons },
    { count: totalTheory },
    { count: totalFlashcards },
    { count: totalExercises },
    { count: totalSimulations },
    { count: totalExcerpts },
  ] = await Promise.all([
    supabase.from("liceu_learner_progression").select("*", { count: "exact", head: true }),
    supabase.from("liceu_modules").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("liceu_lessons").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("liceu_theoretical_content").select("*", { count: "exact", head: true }),
    supabase.from("liceu_flashcards").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("liceu_exercises").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("liceu_simulations").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("liceu_rhetorical_excerpts").select("*", { count: "exact", head: true }).eq("is_published", true),
  ]);

  // Calculate real completion: sum of completed_lessons across all users divided by (total lessons × active students)
  const { data: allProg } = await supabase.from("liceu_learner_progression").select("completed_lessons");
  let totalCompleted = 0;
  for (const p of (allProg ?? [])) {
    totalCompleted += (p.completed_lessons?.length ?? 0);
  }
  const maxPossible = (totalLessons ?? 1) * Math.max(1, activeStudents ?? 0);
  const completionRate = maxPossible > 0 ? Math.round((totalCompleted / maxPossible) * 100) : 0;

  return {
    activeStudents: activeStudents ?? 0,
    modulesCompletionRate: completionRate,
    totalModules: totalModules ?? 0,
    totalLessons: totalLessons ?? 0,
    totalTheoreticalContent: totalTheory ?? 0,
    totalFlashcards: totalFlashcards ?? 0,
    totalExercises: totalExercises ?? 0,
    totalSimulations: totalSimulations ?? 0,
    totalExcerpts: totalExcerpts ?? 0,
  };
}

export type AdminStudentRow = {
  id: string;
  name: string;
  email: string;
  currentModule: string;
  completedLessons: number;
  totalLessons: number;
  completionPct: number;
  lastActivity: string;
  status: "active" | "stuck" | "inactive";
  accessGrants: Array<{ moduleId: string; moduleTitle: string; grantType: string; expiresAt: string | null }>;
};

export async function getAdminStudents(): Promise<AdminStudentRow[]> {
  const supabase = createSupabaseAdminClient();

  const [
    { data: usersData },
    { data: modulesData },
    { data: lessonsData },
    { data: progData },
    { data: grantsData },
  ] = await Promise.all([
    supabase.from("users").select("id, name, email").limit(200),
    supabase.from("liceu_modules").select("id, title, order_index").eq("is_active", true).order("order_index"),
    supabase.from("liceu_lessons").select("id, module_id").eq("is_published", true),
    supabase.from("liceu_learner_progression").select("user_id, completed_lessons, current_module_id, updated_at"),
    supabase.from("access_grants").select("user_id, modules, grant_type, expires_at").is("revoked_at", null)
      .or("expires_at.is.null,expires_at.gt.now()"),
  ]);

  const users = usersData ?? [];
  const modules = modulesData ?? [];
  const lessons = lessonsData ?? [];
  const allProg = progData ?? [];
  const allGrants = grantsData ?? [];

  const moduleById = new Map(modules.map(m => [m.id, m]));
  const lessonsByModule = new Map<string, string[]>();
  for (const l of lessons) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push(l.id);
    lessonsByModule.set(l.module_id, arr);
  }

  const progByUser = new Map<string, { completed_lessons: string[]; current_module_id: string | null; updated_at: string | null }>();
  for (const p of allProg) {
    progByUser.set(p.user_id, {
      completed_lessons: p.completed_lessons ?? [],
      current_module_id: p.current_module_id ?? null,
      updated_at: p.updated_at ?? null,
    });
  }

  const grantsByUser = new Map<string, typeof allGrants>();
  for (const g of allGrants) {
    const arr = grantsByUser.get(g.user_id) ?? [];
    arr.push(g);
    grantsByUser.set(g.user_id, arr);
  }

  const now = Date.now();
  const daysAgo = (iso?: string | null) => {
    if (!iso) return 999;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return 999;
    return Math.floor((now - t) / (1000 * 60 * 60 * 24));
  };

  const totalLessonCount = lessons.length;

  return users.map(u => {
    const prog = progByUser.get(u.id);
    const completed = prog?.completed_lessons?.length ?? 0;
    const completionPct = totalLessonCount > 0 ? Math.round((completed / totalLessonCount) * 100) : 0;
    const d = daysAgo(prog?.updated_at);
    const status: AdminStudentRow["status"] = d <= 7 ? "active" : d <= 21 ? "stuck" : "inactive";

    // Current module from progression
    let currentModule = "—";
    const curModId = prog?.current_module_id;
    if (curModId && moduleById.has(curModId)) {
      currentModule = moduleById.get(curModId)!.title;
    } else {
      for (const m of modules) {
        const modLessons = lessonsByModule.get(m.id) ?? [];
        if (modLessons.some(lid => !prog?.completed_lessons?.includes(lid))) {
          currentModule = m.title;
          break;
        }
      }
    }

    // Access grants
    const userGrants = grantsByUser.get(u.id) ?? [];
    const accessGrants = userGrants.flatMap((g: Record<string, unknown>) => {
      const moduleIds: string[] = Array.isArray(g.modules) ? g.modules : [];
      return moduleIds.map(mid => ({
        moduleId: mid,
        moduleTitle: moduleById.get(mid)?.title ?? mid.slice(0, 8),
        grantType: (g.grant_type as string) ?? "manual",
        expiresAt: g.expires_at ? new Date(g.expires_at as string).toISOString().slice(0, 10) : null,
      }));
    });

    return {
      id: u.id,
      name: (u.name?.trim() || u.email?.trim() || u.id.slice(0, 8)) as string,
      email: u.email ?? "",
      currentModule,
      completedLessons: completed,
      totalLessons: totalLessonCount,
      completionPct,
      lastActivity: prog?.updated_at ? new Date(prog.updated_at).toISOString().slice(0, 10) : "—",
      status,
      accessGrants,
    };
  });
}