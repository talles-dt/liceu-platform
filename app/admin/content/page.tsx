import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ContentEditor } from "@/components/admin/ContentEditor";

type DbModule = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  is_active: boolean;
};

type DbLesson = {
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

type DbTheoreticalContent = {
  lesson_id: string;
  section_order: number;
  title: string;
  content_markdown: string;
  key_concepts: string[];
  rhetorical_references: unknown;
};

type DbFlashcard = {
  lesson_id: string;
  front: string;
  back: string;
  concept: string;
  rhetorical_dimension: string;
  archetype_keys: string[];
  difficulty_tier: number;
  tags: string[];
  source_location: string;
  is_published: boolean;
};

type DbExercise = {
  lesson_id: string;
  exercise_type: string;
  title: string;
  prompt_markdown: string;
  expected_answer: unknown;
  rhetorical_dimension: string;
  archetype_keys: string[];
  difficulty_tier: number;
  estimated_minutes: number;
  is_published: boolean;
};

type DbSimulation = {
  module_id: string;
  title: string;
  scenario_markdown: string;
  simulation_constraint: string;
  success_criteria: unknown;
  simulation_type: string;
  related_lessons: string[];
  rhetorical_dimensions: string[];
  archetype_keys: string[];
  difficulty_tier: number;
  estimated_minutes: number;
  is_published: boolean;
};

type DbExcerpt = {
  lesson_id: string;
  author: string;
  work: string;
  book: string;
  section: string;
  quote: string;
  paraphrase: string;
  concept_illustrated: string;
  language: string;
  translation_ref: string;
  is_published: boolean;
};

type AdminModuleData = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  is_active: boolean;
  lessons: Array<{
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
    theory: Array<{
      lesson_id: string;
      section_order: number;
      title: string;
      content_markdown: string;
      key_concepts: string[];
      rhetorical_references: unknown;
    }>;
    flashcards: Array<{
      lesson_id: string;
      front: string;
      back: string;
      concept: string;
      rhetorical_dimension: string;
      archetype_keys: string[];
      difficulty_tier: number;
      tags: string[];
      source_location: string;
      is_published: boolean;
    }>;
    exercises: Array<{
      lesson_id: string;
      exercise_type: string;
      title: string;
      prompt_markdown: string;
      expected_answer: unknown;
      rhetorical_dimension: string;
      archetype_keys: string[];
      difficulty_tier: number;
      estimated_minutes: number;
      is_published: boolean;
    }>;
    assignment: { assignment_prompt: string; speech_prompt: string } | null;
    text: { title: string; author: string | null; content: string } | null;
  }>;
  simulations: Array<{
    module_id: string;
    title: string;
    scenario_markdown: string;
    simulation_constraint: string;
    success_criteria: unknown;
    simulation_type: string;
    related_lessons: string[];
    rhetorical_dimensions: string[];
    archetype_keys: string[];
    difficulty_tier: number;
    estimated_minutes: number;
    is_published: boolean;
  }>;
  excerpts: Array<{
    lesson_id: string;
    author: string;
    work: string;
    book: string;
    section: string;
    quote: string;
    paraphrase: string;
    concept_illustrated: string;
    language: string;
    translation_ref: string;
    is_published: boolean;
  }>;
  assignment: { assignment_prompt: string; speech_prompt: string } | null;
  text: { title: string; author: string | null; content: string } | null;
};

export default async function AdminContentPage() {
  const supabase = createSupabaseAdminClient();

  const [
    { data: modulesData },
    { data: lessonsData },
    { data: theoryData },
    { data: flashcardsData },
    { data: exercisesData },
    { data: simulationsData },
    { data: excerptsData },
  ] = await Promise.all([
    supabase
      .from("liceu_modules")
      .select("id, code, title, subtitle, description, order_index, estimated_hours, is_active")
      .order("order_index"),
    supabase
      .from("liceu_lessons")
      .select("id, module_id, code, title, subtitle, learning_objective, rhetorical_dimension, archetype_keys, difficulty_tier, estimated_minutes, prerequisites, order_index, is_published")
      .order("order_index"),
    supabase
      .from("liceu_theoretical_content")
      .select("lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references")
      .order("section_order"),
    supabase
      .from("liceu_flashcards")
      .select("lesson_id, front, back, concept, rhetorical_dimension, archetype_keys, difficulty_tier, tags, source_location, is_published")
      .eq("is_published", true),
    supabase
      .from("liceu_exercises")
      .select("lesson_id, exercise_type, title, prompt_markdown, expected_answer, rhetorical_dimension, archetype_keys, difficulty_tier, estimated_minutes, is_published")
      .eq("is_published", true),
    supabase
      .from("liceu_simulations")
      .select("module_id, title, scenario_markdown, simulation_constraint, success_criteria, simulation_type, related_lessons, rhetorical_dimensions, archetype_keys, difficulty_tier, estimated_minutes, is_published")
      .eq("is_published", true),
    supabase
      .from("liceu_rhetorical_excerpts")
      .select("lesson_id, author, work, book, section, quote, paraphrase, concept_illustrated, language, translation_ref, is_published")
      .eq("is_published", true),
  ]);

  const modules = (modulesData as DbModule[]) ?? [];
  const lessons = (lessonsData as DbLesson[]) ?? [];
  const theory = (theoryData as DbTheoreticalContent[]) ?? [];
  const flashcards = (flashcardsData as DbFlashcard[]) ?? [];
  const exercises = (exercisesData as DbExercise[]) ?? [];
  const simulations = (simulationsData as DbSimulation[]) ?? [];
  const excerpts = (excerptsData as DbExcerpt[]) ?? [];

  // Group data by module/lesson
  const lessonsByModule = new Map<string, DbLesson[]>();
  for (const l of lessons) {
    if (!lessonsByModule.has(l.module_id)) lessonsByModule.set(l.module_id, []);
    lessonsByModule.get(l.module_id)!.push(l);
  }

  const theoryByLesson = new Map<string, DbTheoreticalContent[]>();
  for (const t of theory) {
    if (!theoryByLesson.has(t.lesson_id)) theoryByLesson.set(t.lesson_id, []);
    theoryByLesson.get(t.lesson_id)!.push(t);
  }

  const flashcardsByLesson = new Map<string, DbFlashcard[]>();
  for (const f of flashcards) {
    if (!flashcardsByLesson.has(f.lesson_id)) flashcardsByLesson.set(f.lesson_id, []);
    flashcardsByLesson.get(f.lesson_id)!.push(f);
  }

  const exercisesByLesson = new Map<string, DbExercise[]>();
  for (const e of exercises) {
    if (!exercisesByLesson.has(e.lesson_id)) exercisesByLesson.set(e.lesson_id, []);
    exercisesByLesson.get(e.lesson_id)!.push(e);
  }

  const simulationsByModule = new Map<string, DbSimulation[]>();
  for (const s of simulations) {
    if (!simulationsByModule.has(s.module_id)) simulationsByModule.set(s.module_id, []);
    simulationsByModule.get(s.module_id)!.push(s);
  }

  const excerptsByLesson = new Map<string, DbExcerpt[]>();
  for (const x of excerpts) {
    if (!excerptsByLesson.has(x.lesson_id)) excerptsByLesson.set(x.lesson_id, []);
    excerptsByLesson.get(x.lesson_id)!.push(x);
  }

  const moduleData: AdminModuleData[] = modules.map((m) => ({
    id: m.id,
    code: m.code,
    title: m.title,
    subtitle: m.subtitle,
    description: m.description,
    order_index: m.order_index,
    estimated_hours: m.estimated_hours,
    is_active: m.is_active,
    lessons: (lessonsByModule.get(m.id) ?? []).map((l) => ({
      ...l,
      theory: theoryByLesson.get(l.id) ?? [],
      flashcards: flashcardsByLesson.get(l.id) ?? [],
      exercises: exercisesByLesson.get(l.id) ?? [],
      assignment: null,
      text: null,
    })),
    simulations: simulationsByModule.get(m.id) ?? [],
    excerpts: [], // Module-level excerpts would go here if any
    assignment: null,
    text: null,
  }));

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/content
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Conteúdo do Liceu Underground
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          {modules.length} módulos, {lessons.length} lições, {theory.length} textos teóricos, {flashcards.length} flashcards, {exercises.length} exercícios, {simulations.length} simulações
        </div>
      </header>

      <div className="mt-6">
        <ContentEditor modules={moduleData} />
      </div>
    </div>
  );
}