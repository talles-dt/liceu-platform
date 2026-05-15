import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  ApplicationsTable,
  type ApplicationRow,
} from "@/components/admin/tables/ApplicationsTable";
import { MentorshipTable, type SessionRow } from "@/components/admin/tables/MentorshipTable";

export default async function AdminMentorshipPage() {
  const supabase = createSupabaseAdminClient();

  // Applications (qualifying interview pipeline)
  const { data: applicationsData } = await supabase
    .from("mentoring_applications")
    .select("id, email, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const applications =
    (applicationsData as unknown as {
      id: string;
      email: string;
      status: string;
      created_at: string | null;
    }[]) ?? [];

  const applicationRows: ApplicationRow[] = applications.map((a) => ({
    id: a.id,
    email: a.email,
    status: a.status,
    createdAt: a.created_at ? a.created_at.slice(0, 10) : "—",
  }));

  // Counts per status for the header metrics
  const counts = applications.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Active sessions (post-program Cal.com sessions)
  const { data: sessionsData } = await supabase
    .from("mentorship_sessions")
    .select("id, user_id, scheduled_at, status, module_id")
    .order("scheduled_at", { ascending: true })
    .limit(200);

  const sessions =
    (sessionsData as unknown as {
      id: string;
      user_id: string;
      scheduled_at: string | null;
      status: string | null;
      module_id?: string | null;
    }[]) ?? [];

  const userIds = Array.from(new Set(sessions.map((s) => s.user_id)));
  const { data: usersData } =
    userIds.length > 0
      ? await supabase.from("users").select("id, name, email").in("id", userIds)
      : { data: [] as unknown[] };

  const users =
    (usersData as unknown as {
      id: string;
      name?: string | null;
      email?: string | null;
    }[]) ?? [];
  const userById = new Map(users.map((u) => [u.id, u]));

  const sessionRows: SessionRow[] =
    sessions.length > 0
      ? sessions.map((s) => {
          const u = userById.get(s.user_id);
          return {
            id: s.id,
            student: (u?.name?.trim() || u?.email?.trim() || s.user_id.slice(0, 8)) as string,
            when: s.scheduled_at ? s.scheduled_at.replace("T", " ").slice(0, 16) : "—",
            status: (s.status ?? "upcoming").toLowerCase(),
            readiness: "—",
          };
        })
      : [{ id: "placeholder", student: "—", when: "—", status: "—", readiness: "—" }];

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/mentorship
        </div>
        <div className="mt-2 font-[var(--font-noto-serif)] text-[22px] leading-tight text-[var(--liceu-text)]">
          Mentorship operations
        </div>
        <div className="mt-2 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Applications pipeline and active sessions.
        </div>
      </header>

      {/* Pipeline metrics */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            ["pending_interview", "Aguardando entrevista"],
            ["approved_pending_payment", "Aprovados"],
            ["active", "Ativos"],
            ["rejected", "Rejeitados"],
          ] as const
        ).map(([status, label]) => (
          <div
            key={status}
            className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3"
          >
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
              {label}
            </div>
            <div className="mt-2 font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">
              {counts[status] ?? 0}
            </div>
          </div>
        ))}
      </div>

      {/* Applications table */}
      <div className="mt-6">
        <div className="mb-3 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          Candidaturas
        </div>
        {applicationRows.length > 0 ? (
          <ApplicationsTable rows={applicationRows} />
        ) : (
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-4">
            <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
              Nenhuma candidatura ainda.
            </p>
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="mt-8">
        <div className="mb-3 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          Sessões ativas
        </div>
        <MentorshipTable rows={sessionRows} />
      </div>
    </div>
  );
}
