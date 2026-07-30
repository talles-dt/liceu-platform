import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getCommerceConfig } from "@/lib/commerce";

export const revalidate = 0;

export default async function AdminMentorDiagnosticsPage() {
  const supabase = createSupabaseAdminClient();
  const { calInterviewLink, calMentoringLink } = getCommerceConfig();

  const [
    { data: sessionsData },
    { data: applicationsData },
    { data: progressionData },
    { data: usersData },
  ] = await Promise.all([
    supabase.from("mentorship_sessions").select("id, user_id, scheduled_at, status, module_id").limit(50),
    supabase.from("mentoring_applications").select("id, email, status, created_at").limit(50),
    supabase.from("liceu_learner_progression").select("user_id, completed_lessons, updated_at").limit(50),
    supabase
      .from("users")
      .select("id, email, name, role, created_at, last_login_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const sessions = (sessionsData as unknown as { id: string; user_id: string; scheduled_at?: string | null; status?: string | null }[] | null) ?? [];
  const applications = (applicationsData as unknown as { id: string; email: string; status: string; created_at?: string | null }[] | null) ?? [];
  const progression = (progressionData as unknown as { user_id: string; completed_lessons?: string[]; updated_at?: string | null }[] | null) ?? [];
  const users = (usersData as unknown as { id: string; email: string; name?: string | null; role?: string | null; created_at?: string | null; last_login_at?: string | null }[] | null) ?? [];

  const sessionsByUser = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const arr = sessionsByUser.get(s.user_id) ?? [];
    arr.push(s);
    sessionsByUser.set(s.user_id, arr);
  }
  const applicationsByEmail = new Map<string, typeof applications>();
  for (const a of applications) {
    const key = (a.email ?? "").toLowerCase();
    applicationsByEmail.set(key, [...(applicationsByEmail.get(key) ?? []), a]);
  }

  const rows = users.map((u) => {
    const userSessions = sessionsByUser.get(u.id) ?? [];
    const userApplications = applicationsByEmail.get((u.email ?? "").toLowerCase()) ?? [];
    const prog = progression.find((p) => p.user_id === u.id);
    const completed = (prog?.completed_lessons?.length ?? 0);

    return {
      id: u.id,
      name: u.name?.trim() || u.email,
      email: u.email,
      role: u.role ?? "—",
      created_at: u.created_at?.slice(0, 10) ?? "—",
      last_login_at: u.last_login_at?.slice(0, 19).replace("T", " ") ?? "—",
      completed,
      sessions: userSessions.length,
      applications: userApplications.length,
      session_next: userSessions[0]?.scheduled_at?.replace("T", " ").slice(0, 16) ?? "—",
      application_status: userApplications[0]?.status ?? "—",
    };
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">/admin/mentor-diagnostics</div>
        <div className="mt-2 font-[var(--font-noto-serif)] text-[22px] leading-tight text-[var(--liceu-text)]">Mentor diagnostics</div>
        <div className="mt-2 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">Non-secret sanity checks for mentoring + progression.</div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">users</div>
          <div className="mt-2 font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">{users.length}</div>
        </div>
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">progression rows</div>
          <div className="mt-2 font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">{progression.length}</div>
        </div>
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">applications</div>
          <div className="mt-2 font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">{applications.length}</div>
        </div>
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">sessions</div>
          <div className="mt-2 font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">{sessions.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">CAL_INTERVIEW_LINK</div>
          <div className="mt-2 font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-text)]">{calInterviewLink || "—"}</div>
        </div>
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">CAL_MENTORING_LINK</div>
          <div className="mt-2 font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-text)]">{calMentoringLink || "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">admin route</div>
          <div className="mt-2 font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-text)]">/admin/mentorship={`${sessions.length} session(s)`}</div>
          <div className="mt-1 font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-text)]">/app/admin/mentorship/page.tsx</div>
        </div>
        <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">student route</div>
          <div className="mt-2 font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-text)]">{`/mentorship -> cal=${calMentoringLink ? "wired" : "missing"}, completed>=7=${rows.some(r => r.completed >= 7)}`}</div>
          <div className="mt-1 font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-text)]">/app/mentorship/page.tsx</div>
        </div>
      </div>

      <div>
        <div className="mb-3 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">users</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--liceu-stone)]/40">
                <th className="py-2 pr-3 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">user</th>
                <th className="py-2 pr-3 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">role</th>
                <th className="py-2 pr-3 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">completed</th>
                <th className="py-2 pr-3 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">sessions</th>
                <th className="py-2 pr-3 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">application</th>
                <th className="py-2 pr-3 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">next session</th>
                <th className="py-2 pr-3 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">last login</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--liceu-stone)]/15">
                  <td className="py-2 pr-3">
                    <div className="font-serif text-[13px] text-[var(--liceu-text)]">{r.name}</div>
                    <div className="font-mono text-[10px] text-[var(--liceu-muted)]/70">{r.email}</div>
                  </td>
                  <td className="py-2 pr-3 font-mono text-[10px] text-[var(--liceu-muted)]">{r.role}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] tabular-nums text-[var(--liceu-text)]">{r.completed}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] tabular-nums text-[var(--liceu-text)]">{r.sessions}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] tabular-nums text-[var(--liceu-text)]">{r.applications ? `${r.applications} (${r.application_status})` : "0"}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] tabular-nums text-[var(--liceu-muted)]">{r.session_next}</td>
                  <td className="py-2 pr-3 font-mono text-[10px] tabular-nums text-[var(--liceu-muted)]">{r.last_login_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
