import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type AdminMetrics = {
  activeStudents: number;
  modulesCompletionRate: number; // 0..100
  quizSuccessRate: number; // 0..100
  assignmentApprovalRate: number; // 0..100
  mentorshipUtilization: number; // 0..100
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  // Best-effort: schema varies. Keep deterministic fallbacks.
  const supabase = await createSupabaseServerClient();

  const out: AdminMetrics = {
    activeStudents: 0,
    modulesCompletionRate: 0,
    quizSuccessRate: 0,
    assignmentApprovalRate: 0,
    mentorshipUtilization: 0,
  };

  // Active students (distinct users in module_progress)
  {
    const { data, error } = await supabase
      .from("module_progress")
      .select("user_id");

    if (!error && data) {
      const set = new Set<string>();
      for (const r of data as unknown as { user_id: string }[]) set.add(r.user_id);
      out.activeStudents = set.size;
    }
  }

  // Modules completion rate: completed / total module_progress rows
  {
    const { data, error } = await supabase
      .from("module_progress")
      .select("completed");

    if (!error && data && data.length > 0) {
      const rows = data as unknown as { completed: boolean | null }[];
      const done = rows.filter((r) => r.completed === true).length;
      out.modulesCompletionRate = Math.round((done / rows.length) * 100);
    }
  }

  // Quiz success rate: passed attempts / total quiz_attempts (if exists)
  {
    const { data, error } = await supabase.from("quiz_attempts").select("passed");
    if (!error && data && data.length > 0) {
      const rows = data as unknown as { passed: boolean | null }[];
      const ok = rows.filter((r) => r.passed === true).length;
      out.quizSuccessRate = Math.round((ok / rows.length) * 100);
    }
  }

  // Assignment approval rate: approved / total submissions (if exists)
  {
    const { data, error } = await supabase
      .from("assignment_submissions")
      .select("status");
    if (!error && data && data.length > 0) {
      const rows = data as unknown as { status: string | null }[];
      const approved = rows.filter((r) => r.status === "approved").length;
      out.assignmentApprovalRate = Math.round((approved / rows.length) * 100);
    }
  }

  // Mentorship utilization: completed sessions / (completed + upcoming + missed)
  // If table doesn't exist, keep 0.
  {
    const { data, error } = await supabase
      .from("mentorship_sessions")
      .select("status");
    if (!error && data && data.length > 0) {
      const rows = data as unknown as { status: string | null }[];
      const total = rows.length;
      const completed = rows.filter((r) => r.status === "completed").length;
      out.mentorshipUtilization = Math.round((completed / total) * 100);
    }
  }

  return out;
}

export type AdminStudentRow = {
  id: string;
  name: string;
  currentModule: string;
  completionPct: number;
  lastActivity: string;
  status: "active" | "stuck" | "inactive";
};

export async function getAdminStudents(): Promise<AdminStudentRow[]> {
  const supabase = await createSupabaseServerClient();

  // Schema guess: users table has id/email/name; module_progress has completion.
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, email")
    .limit(200);

  const { data: modulesData } = await supabase
    .from("modules")
    .select("id, title, order_index")
    .order("order_index", { ascending: true });

  const { data: progressData } = await supabase
    .from("module_progress")
    .select("user_id, module_id, completed, quiz_score, assignment_submitted, updated_at");

  const users =
    (usersData as unknown as { id: string; name?: string | null; email?: string | null }[]) ??
    [];
  const modules =
    (modulesData as unknown as { id: string; title: string; order_index: number }[]) ?? [];
  const progress =
    (progressData as unknown as {
      user_id: string;
      module_id: string;
      completed: boolean | null;
      quiz_score?: number | null;
      assignment_submitted?: boolean | null;
      updated_at?: string | null;
    }[]) ?? [];

  const moduleById = new Map(modules.map((m) => [m.id, m]));
  const progressByUser = new Map<string, typeof progress>();
  for (const p of progress) {
    const arr = progressByUser.get(p.user_id) ?? [];
    arr.push(p);
    progressByUser.set(p.user_id, arr);
  }

  const now = Date.now();
  const days = (iso?: string | null) => {
    if (!iso) return 999;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return 999;
    return Math.floor((now - t) / (1000 * 60 * 60 * 24));
  };

  return users.map((u) => {
    const rows = progressByUser.get(u.id) ?? [];
    const total = Math.max(1, rows.length);
    const done = rows.filter((r) => r.completed === true).length;
    const completionPct = Math.round((done / total) * 100);

    // current module = lowest order_index not completed
    const incomplete = rows
      .filter((r) => r.completed !== true)
      .map((r) => moduleById.get(r.module_id))
      .filter(Boolean) as { id: string; title: string; order_index: number }[];
    incomplete.sort((a, b) => a.order_index - b.order_index);
    const currentModule = incomplete[0]?.title ?? "—";

    const last = rows
      .map((r) => r.updated_at ?? null)
      .filter(Boolean)
      .sort()
      .at(-1) as string | undefined;

    const d = days(last);
    const status: AdminStudentRow["status"] =
      d <= 7 ? "active" : d <= 21 ? "stuck" : "inactive";

    return {
      id: u.id,
      name: (u.name?.trim() || u.email?.trim() || u.id.slice(0, 8)) as string,
      currentModule,
      completionPct,
      lastActivity: last ? new Date(last).toISOString().slice(0, 10) : "—",
      status,
    };
  });
}

