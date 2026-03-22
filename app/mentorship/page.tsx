import { redirect } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";

export default async function MentorshipPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: unlocked } = await supabase
    .from("module_progress")
    .select("module_id, mentorship_unlocked")
    .eq("user_id", user.id)
    .eq("mentorship_unlocked", true);

  const available = (unlocked ?? []).length > 0;

  return (
    <ReadingLayout
      eyebrow="MENTORIA"
      title="Orientação individual, após estudo disciplinado."
      subtitle="A mentoria não substitui o treino. Ela corrige rumo, afia método, e exige preparo."
    >
      <div className="space-y-10">
        <section className="space-y-4">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Requisitos
          </div>
          <ul className="list-disc space-y-2 pl-5 font-serif text-[15px] leading-[1.9] text-[var(--liceu-text)]">
            <li>Conclusão dos módulos anteriores ao tema.</li>
            <li>Quiz com nota mínima de 70%.</li>
            <li>Produção escrita enviada e aprovada.</li>
            <li>Uma nota breve com 2–3 perguntas precisas.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Estado
          </div>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-4">
            <div className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-text)]">
              {available ? "Sessão liberada" : "Ainda não liberada"}
            </div>
            <p className="mt-2 font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
              {available
                ? "Você concluiu ao menos um módulo com mentoria liberada."
                : "Conclua um módulo para liberar a próxima sessão."}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Agenda
          </div>

          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-4">
            <p className="font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
              Integração planejada: Cal.com.
              <br />
              Fluxo: verificar módulo concluído → verificar sessão disponível →
              liberar agenda.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <MinimalButton disabled={!available}>Escolher horário</MinimalButton>
              <MinimalButton variant="quiet">Entrar na fila</MinimalButton>
              <MinimalButton variant="quiet">Comprar mentoria</MinimalButton>
            </div>
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}

