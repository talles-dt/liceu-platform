import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ContentEditor } from "@/components/admin/ContentEditor";

type DbModule = { id: string; title: string; order_index: number; course_id: string };
type DbAssignment = { module_id: string; assignment_prompt: string; speech_prompt: string };
type DbText = { module_id: string; title: string; author: string | null; content: string };

export default async function AdminContentPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: modulesData }, { data: assignmentsData }, { data: textsData }] =
    await Promise.all([
      supabase.from("modules").select("id, title, order_index, course_id").order("order_index"),
      supabase.from("module_assignments").select("module_id, assignment_prompt, speech_prompt"),
      supabase.from("module_texts").select("module_id, title, author, content"),
    ]);

  const modules = (modulesData as DbModule[]) ?? [];
  const assignments = (assignmentsData as DbAssignment[]) ?? [];
  const texts = (textsData as DbText[]) ?? [];

  const assignmentsByModule = new Map(assignments.map((a) => [a.module_id, a]));
  const textsByModule = new Map(texts.map((t) => [t.module_id, t]));

  const moduleData = modules.map((m) => ({
    id: m.id,
    title: m.title,
    order_index: m.order_index,
    assignment: assignmentsByModule.get(m.id) ?? null,
    text: textsByModule.get(m.id) ?? null,
  }));

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/content
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Conteúdo dos módulos
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Exercícios, textos clássicos e flashcards. Selecione um módulo para editar.
        </div>
      </header>

      <div className="mt-6">
        <ContentEditor modules={moduleData} />
      </div>
    </div>
  );
}
