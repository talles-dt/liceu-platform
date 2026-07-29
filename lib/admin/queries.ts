import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type AdminMetrics = {
  activeStudents: number;
  modulesCompletionRate: number;
  quizSuccessRate: number;
  assignmentApprovalRate: number;
  mentorshipUtilization: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = createSupabaseAdminClient();

  // Active students from liceu_learner_progression
  const { count: activeCount } = await supabase
    .from("liceu_learner_progression")
    .select("*", { count: "exact", head: true });

  // Module total count
  const { count: moduleCount } = await supabase
    .from("liceu_modules")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Lesson total count
  const { count: lessonCount } = await supabase
    .from("liceu_lessons")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  // Completed lessons across all users
  const { data: allProg } = await supabase
    .from("liceu_learner_progression")
    .select("completed_lessons");

  let totalCompleted = 0;
  let totalLessonsAssigned = 0;
  for (const p of allProg ?? []) {
    totalCompleted += (p.completed_lessons?.length ?? 0);
    totalLessonsAssigned += lessonCount ?? 0;
  }

  const modulesCompletionRate = totalLessonsAssigned > 0 ? Math.round((totalCompleted / totalLessonsAssigned) * 100) : 0;

  return {
    activeStudents: activeCount ?? 0,
    modulesCompletionRate,
    quizSuccessRate: 0, // No quiz table yet
    assignmentApprovalRate: 0, // Not implemented
    mentorshipUtilization: 0, // Not implemented
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

  // Users from auth.users
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, email")
    .limit(200);

  // All modules
  const { data: modulesData } = await supabase
    .from("liceu_modules")
    .select("id, title, order_index")
    .eq("is_active", true)
    .order("order_index");

  // All lessons grouped by module
  const { data: lessonsData } = await supabase
    .from("liceu_lessons")
    .select("id, module_id")
    .eq("is_published", true);

  // All progression data
  const { data: progData } = await supabase
    .from("liceu_learner_progression")
    .select("user_id, completed_lessons, updated_at");

  // All access grants
  const { data: grantsData } = await supabase
    .from("access_grants")
    .select("user_id, modules, grant_type, expires_at")
    .is("revoked_at", null)
    .or("expires_at.is.null,expires_at.gt.now()");

  const users = usersData ?? [];
  const modules = modulesData ?? [];
  const lessons = lessonsData ?? [];
  const allProg = progData ?? [];
  const allGrants = grantsData ?? [];

  // Build lookup maps
  const lessonsByModule = new Map<string, string[]>();
  for (const l of lessons) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push(l.id);
    lessonsByModule.set(l.module_id, arr);
  }

  const moduleById = new Map(modules.map((m) => [m.id, m]));
  const progByUser = new Map<string, { completed_lessons: string[]; updated_at: string | null }>();
  for (const p of allProg) {
    progByUser.set(p.user_id, {
      completed_lessons: p.completed_lessons ?? [],
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

  return users.map((u) => {
    const prog = progByUser.get(u.id);
    const completed = prog?.completed_lessons?.length ?? 0;
    const completionPct = totalLessonCount > 0 ? Math.round((completed / totalLessonCount) * 100) : 0;

    const d = daysAgo(prog?.updated_at);
    const status: AdminStudentRow["status"] =
      d <= 7 ? "active" : d <= 21 ? "stuck" : "inactive";

    // Current module — find first module with incomplete lessons
    let currentModule = "—";
    for (const m of modules) {
      const modLessons = lessonsByModule.get(m.id) ?? [];
      const hasIncomplete = modLessons.some((lid) => !prog?.completed_lessons?.includes(lid));
      if (hasIncomplete) {
        currentModule = `${m.title}`;
        break;
      }
    }

    // Access grants
    const userGrants = grantsByUser.get(u.id) ?? [];
    const accessGrants = userGrants.flatMap((g: Record<string, unknown>) => {
      const moduleIds: string[] = Array.isArray(g.modules) ? g.modules as string[] : [];
      return moduleIds.map((mid) => ({
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