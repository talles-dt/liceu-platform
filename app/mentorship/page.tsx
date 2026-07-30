import { redirect } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";

export default async function MentorshipPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { calMentoringLink } = getCommerceConfig();

  const [{ data: applications }, { data: bookings }, { data: progression }] = await Promise.all([
    supabase.from("mentoring_applications").select("id, status, created_at").eq("email", (user.email ?? "").toLowerCase()).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("mentoring_bookings").select("id, session_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("liceu_learner_progression").select("completed_lessons, current_module_id, updated_at").eq("user_id", user.id).maybeSingle(),
  ]);

  const application = applications as unknown as { id?: string; status?: string | null; created_at?: string | null } | null;
  const booking = bookings as unknown as { id?: string; session_id?: string | null; created_at?: string | null } | null;
  const completedLessons = ((progression as unknown as { completed_lessons?: string[] } | null)?.completed_lessons?.length ?? 0);

  const canBook = completedLessons >= 7 && Boolean(calMentoringLink);
  const hasBooking = Boolean(booking?.session_id);
  const bookingRecordedAt = booking?.created_at ?? application?.created_at ?? null;

  return (
    <ReadingLayout eyebrow="MENTORIA" title="Orientação individual, após estudo disciplinado." subtitle="A mentoria não substitui o treino. Ela corrige rumo, afia método, e exige preparo.">
      <div className="space-y-10">
        <section className="space-y-4">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">Estado</div>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-4">
            <div className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)]">{canBook ? "Sessão liberada" : "Ainda não liberada"}</div>
            <p className="mt-2 font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
              {canBook ? "Agende sua sessão diretamente pelo Cal.com." : "Conclua o módulo de Fundamentos para liberar a agenda."}
            </p>

            {hasBooking && (
              <p className="mt-2 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-text)]">
                Sessão registrada: {booking?.session_id}
              </p>
            )}

            {!hasBooking && (
              <p className="mt-2 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
                Nenhuma sessão registrada ainda.
              </p>
            )}

            {bookingRecordedAt && (
              <p className="mt-2 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-text)]">
                Registro: {new Date(bookingRecordedAt).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">Agenda</div>
          <div className="space-y-3 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-4">
            {canBook && calMentoringLink ? (
              <div className="flex flex-wrap items-center gap-3">
                <a href={calMentoringLink} target="_blank" rel="noopener noreferrer" className="inline-block border border-[var(--liceu-secondary)]/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-secondary)] hover:bg-[var(--liceu-secondary)]/10">
                  Agendar sessão →
                </a>
                <ConfirmBookingForm user={user} />
                {hasBooking && <CancelBookingForm user={user} sessionId={booking!.session_id!} />}
              </div>
            ) : (
              <MinimalButton disabled>Escolher horário</MinimalButton>
            )}
          </div>

          <ApplicationCard application={application} />
        </section>
      </div>
    </ReadingLayout>
  );
}

function ConfirmBookingForm({ user }: { user: { id: string; email?: string } }) {
  return (
    <form action="/api/mentorship/confirm" method="post" className="inline-flex">
      <input type="hidden" name="user_id" value={user.id} />
      <input type="hidden" name="email" value={user.email ?? ""} />
      <button type="submit" className="border border-[var(--liceu-stone)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)] transition-colors">
        Confirmar agendamento finalizado
      </button>
    </form>
  );
}

function CancelBookingForm({ user, sessionId }: { user: { id: string }; sessionId: string }) {
  return (
    <form action="/api/mentorship/cancel" method="post" className="inline-flex">
      <input type="hidden" name="user_id" value={user.id} />
      <input type="hidden" name="session_id" value={sessionId} />
      <button type="submit" className="border border-[var(--liceu-secondary)]/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-secondary)] hover:bg-[var(--liceu-secondary)]/10">
        Cancelar agendamento selecionado
      </button>
    </form>
  );
}

function ApplicationCard({ application }: { application: { id?: string; status?: string | null; created_at?: string | null } | null }) {
  if (!application) return null;
  return (
    <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/30 px-4 py-3 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
      <div>Status da candidatura: {application.status ?? "—"}</div>
      {application.created_at && <div>Em: {new Date(application.created_at).toLocaleString("pt-BR")}</div>}
    </div>
  );
}
