import { redirect } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";

export default async function MentorshipPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { calInterviewLink, calMentoringLink } = getCommerceConfig();

  const [{ data: applications }, { data: sessionsData }, { data: progression }] =
    await Promise.all([
      supabase
        .from("mentoring_applications")
        .select("id, status, created_at")
        .eq("email", (user.email ?? "").toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("mentorship_sessions")
        .select("id, scheduled_at, status")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: true })
        .limit(1),
      supabase
        .from("liceu_learner_progression")
        .select("completed_lessons, current_module_id, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const application = applications as unknown as { id?: string; status?: string | null; created_at?: string | null } | null;
  const firstSession = (sessionsData as unknown as { id?: string; scheduled_at?: string | null; status?: string | null }[] | null)?.[0] ?? null;
  const completedLessons = ((progression as unknown as { completed_lessons?: string[] } | null)?.completed_lessons?.length ?? 0);

  const mentoringStatus = application?.status ?? null;
  const isFundamentalsComplete = completedLessons >= 7;
  const canBook = isFundamentalsComplete && Boolean(calMentoringLink);

  const statusLabel = canBook
    ? "Sessão liberada"
    : "Ainda não liberada";
  const statusHint = canBook
    ? "Agende sua sessão diretamente pelo Cal.com."
    : "Conclua o módulo de Fundamentos para liberar a agenda.";

  return (
    <ReadingLayout
      eyebrow="MENTORIA"
      title="Orientação individual, após estudo disciplinado."
      subtitle="A mentoria não substitui o treino. Ela corrige rumo, afia método, e exige preparo."
    >
      <div className="space-y-10">
        <section className="space-y-4">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Estado
          </div>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-4">
            <div className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)]">{statusLabel}</div>
            <p className="mt-2 font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
              {statusHint}
            </p>
            {firstSession?.scheduled_at && (
              <p className="mt-2 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-text)]">
                Próxima sessão: {firstSession.scheduled_at.replace("T", " ").slice(0, 16)}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Agenda
          </div>

          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-4">
            <div className="mt-4 flex flex-wrap gap-3">
              {canBook && calMentoringLink ? (
                <a
                  href={calMentoringLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-[var(--liceu-secondary)]/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-secondary)] hover:bg-[var(--liceu-secondary)]/10"
                >
                  Agendar sessão →
                </a>
              ) : (
                <MinimalButton disabled>Escolher horário</MinimalButton>
              )}
            </div>
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}

