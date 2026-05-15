import { createClient } from "@supabase/supabase-js";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    "Missing env var: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)",
  );
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing env var: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getOrCreateCourse(input: {
  title: string;
}): Promise<{ id: string }> {
  const { data: existing, error: selErr } = await supabase
    .from("courses")
    .select("id")
    .eq("title", input.title)
    .maybeSingle<{ id: string }>();
  if (selErr) throw selErr;
  if (existing) return existing;

  const { data: inserted, error: insErr } = await supabase
    .from("courses")
    .insert({ title: input.title })
    .select("id")
    .single<{ id: string }>();
  if (insErr) throw insErr;
  return inserted;
}

async function getOrCreateModule(input: {
  course_id: string;
  order_index: number;
  title: string;
}): Promise<{ id: string }> {
  const { data: existing, error: selErr } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", input.course_id)
    .eq("order_index", input.order_index)
    .maybeSingle<{ id: string }>();
  if (selErr) throw selErr;
  if (existing) return existing;

  const { data: inserted, error: insErr } = await supabase
    .from("modules")
    .insert({
      course_id: input.course_id,
      order_index: input.order_index,
      title: input.title,
    })
    .select("id")
    .single<{ id: string }>();
  if (insErr) throw insErr;
  return inserted;
}

async function getOrCreateLesson(input: {
  module_id: string;
  order_index: number;
  title: string;
}): Promise<{ id: string }> {
  const { data: existing, error: selErr } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", input.module_id)
    .eq("order_index", input.order_index)
    .maybeSingle<{ id: string }>();
  if (selErr) throw selErr;
  if (existing) return existing;

  const { data: inserted, error: insErr } = await supabase
    .from("lessons")
    .insert({
      module_id: input.module_id,
      order_index: input.order_index,
      title: input.title,
    })
    .select("id")
    .single<{ id: string }>();
  if (insErr) throw insErr;
  return inserted;
}

async function getOrCreateQuiz(input: {
  module_id: string;
}): Promise<{ id: string }> {
  const { data: existing, error: selErr } = await supabase
    .from("quizzes")
    .select("id")
    .eq("module_id", input.module_id)
    .maybeSingle<{ id: string }>();
  if (selErr) throw selErr;
  if (existing) return existing;

  const { data: inserted, error: insErr } = await supabase
    .from("quizzes")
    .insert({
      module_id: input.module_id,
    })
    .select("id")
    .single<{ id: string }>();
  if (insErr) throw insErr;
  return inserted;
}

async function upsertQuizQuestion(input: {
  quiz_id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correct_option_id: string;
}): Promise<void> {
  // `quiz_questions` schema varies across projects; we adapt by trying common shapes.
  // Strategy:
  // - Attempt idempotent "find existing" using a likely text column.
  // - Insert/update using the first column set that the schema accepts.

  const optionsJson = input.options as unknown as Json;
  const optionLabels = input.options.map((o) => o.label);
  const correctLabel =
    input.options.find((o) => o.id === input.correct_option_id)?.label ?? "";

  const candidateQuestionTextCols = [
    "question",
    "prompt",
    "text",
    "question_text",
    "body",
  ] as const;

  let existingId: string | null = null;
  for (const col of candidateQuestionTextCols) {
    const q = supabase.from("quiz_questions").select("id").eq("quiz_id", input.quiz_id);
    // dynamic column name (schema-dependent)
    const { data, error } = await (q as unknown as { eq: (c: string, v: unknown) => typeof q })
      .eq(col, input.prompt)
      .maybeSingle<{ id: string }>();
    if (!error && data?.id) {
      existingId = data.id;
      break;
    }
  }

  const insertAttempts: Record<string, unknown>[] = [
    // Minimal that matches many real schemas: question + options (no correct field)
    {
      quiz_id: input.quiz_id,
      question: input.prompt,
      options: optionsJson,
    },
    // If `options` is a string array and `correct_answer` is required
    {
      quiz_id: input.quiz_id,
      question: input.prompt,
      options: optionLabels,
      correct_answer: input.correct_option_id, // often "a" | "b" | "c" | "d"
    },
    {
      quiz_id: input.quiz_id,
      question: input.prompt,
      options: optionLabels,
      correct_answer: correctLabel, // sometimes the full label text
    },
    {
      quiz_id: input.quiz_id,
      question: input.prompt,
      options: optionLabels,
      correct_answer: Math.max(
        0,
        ["a", "b", "c", "d"].indexOf(input.correct_option_id),
      ), // sometimes 0-based index
    },

    // JSON options + correct option id
    {
      quiz_id: input.quiz_id,
      prompt: input.prompt,
      options: optionsJson,
      correct_option_id: input.correct_option_id,
    },
    {
      quiz_id: input.quiz_id,
      question: input.prompt,
      options: optionsJson,
      correct_option_id: input.correct_option_id,
    },
    {
      quiz_id: input.quiz_id,
      text: input.prompt,
      options: optionsJson,
      correct_option_id: input.correct_option_id,
    },

    // Flattened options (a/b/c/d) + correct option id
    {
      quiz_id: input.quiz_id,
      question: input.prompt,
      option_a: input.options.find((o) => o.id === "a")?.label ?? "",
      option_b: input.options.find((o) => o.id === "b")?.label ?? "",
      option_c: input.options.find((o) => o.id === "c")?.label ?? "",
      option_d: input.options.find((o) => o.id === "d")?.label ?? "",
      correct_option_id: input.correct_option_id,
    },
    {
      quiz_id: input.quiz_id,
      question_text: input.prompt,
      option_a: input.options.find((o) => o.id === "a")?.label ?? "",
      option_b: input.options.find((o) => o.id === "b")?.label ?? "",
      option_c: input.options.find((o) => o.id === "c")?.label ?? "",
      option_d: input.options.find((o) => o.id === "d")?.label ?? "",
      correct_option: input.correct_option_id,
    },

    // Minimal: just link to quiz + question text
    { quiz_id: input.quiz_id, question: input.prompt },
    { quiz_id: input.quiz_id, text: input.prompt },
    { quiz_id: input.quiz_id, question_text: input.prompt },
    { quiz_id: input.quiz_id, body: input.prompt },

    // JSON-ish option payloads with alternative column names
    {
      quiz_id: input.quiz_id,
      question_text: input.prompt,
      choices: input.options.map((o) => o.label),
      correct_choice: input.correct_option_id,
    },
    {
      quiz_id: input.quiz_id,
      question_text: input.prompt,
      choices: input.options.map((o) => o.label),
      correct_index: ["a", "b", "c", "d"].indexOf(input.correct_option_id),
    },
    {
      quiz_id: input.quiz_id,
      question_text: input.prompt,
      options: input.options.map((o) => o.label),
      answer: input.options.find((o) => o.id === input.correct_option_id)?.label ?? "",
    },
    {
      quiz_id: input.quiz_id,
      question_text: input.prompt,
      alternatives: input.options.map((o) => o.label),
      correct: input.correct_option_id,
    },

    // Flattened options with alternative correct fields
    {
      quiz_id: input.quiz_id,
      question_text: input.prompt,
      a: input.options.find((o) => o.id === "a")?.label ?? "",
      b: input.options.find((o) => o.id === "b")?.label ?? "",
      c: input.options.find((o) => o.id === "c")?.label ?? "",
      d: input.options.find((o) => o.id === "d")?.label ?? "",
      correct: input.correct_option_id,
    },
    {
      quiz_id: input.quiz_id,
      question_text: input.prompt,
      a: input.options.find((o) => o.id === "a")?.label ?? "",
      b: input.options.find((o) => o.id === "b")?.label ?? "",
      c: input.options.find((o) => o.id === "c")?.label ?? "",
      d: input.options.find((o) => o.id === "d")?.label ?? "",
      answer: input.options.find((o) => o.id === input.correct_option_id)?.label ?? "",
    },
  ];

  async function tryInsert(row: Record<string, unknown>) {
    const { error } = await supabase.from("quiz_questions").insert(row);
    return { ok: !error, error };
  }

  async function tryUpdate(id: string, row: Record<string, unknown>) {
    const { error } = await supabase.from("quiz_questions").update(row).eq("id", id);
    return { ok: !error, error };
  }

  if (!existingId) {
    const errors: string[] = [];
    for (const row of insertAttempts) {
      const res = await tryInsert(row);
      if (res.ok) return;
      if (res.error?.message) errors.push(res.error.message);
    }
    throw new Error(
      [
        "Unable to insert into quiz_questions: unknown schema (none of the candidate column sets worked).",
        "",
        "Observed errors (unique):",
        ...Array.from(new Set(errors)).slice(0, 12).map((e) => `- ${e}`),
      ].join("\n"),
    );
  }

  const updateErrors: string[] = [];
  for (const row of insertAttempts) {
    const res = await tryUpdate(existingId, row);
    if (res.ok) return;
    if (res.error?.message) updateErrors.push(res.error.message);
  }
  throw new Error(
    [
      "Unable to update quiz_questions: unknown schema (none of the candidate column sets worked).",
      "",
      "Observed errors (unique):",
      ...Array.from(new Set(updateErrors)).slice(0, 12).map((e) => `- ${e}`),
    ].join("\n"),
  );
}

async function getOrCreateAssignment(input: {
  module_id: string;
  title: string;
  prompt: string;
}): Promise<{ id: string }> {
  const { data: existing, error: selErr } = await supabase
    .from("assignments")
    .select("id")
    .eq("module_id", input.module_id)
    .maybeSingle<{ id: string }>();
  if (selErr) throw selErr;
  if (existing) return existing;

  const attempts: Record<string, unknown>[] = [
    { module_id: input.module_id, title: input.title, prompt: input.prompt },
    { module_id: input.module_id, title: input.title, instructions: input.prompt },
    { module_id: input.module_id, name: input.title, prompt: input.prompt },
    { module_id: input.module_id, name: input.title, instructions: input.prompt },
    { module_id: input.module_id, prompt: input.prompt },
    { module_id: input.module_id, instructions: input.prompt },
  ];

  const errors: string[] = [];
  for (const row of attempts) {
    const { data: inserted, error } = await supabase
      .from("assignments")
      .insert(row)
      .select("id")
      .single<{ id: string }>();
    if (!error && inserted) return inserted;
    if (error?.message) errors.push(error.message);
  }

  throw new Error(
    [
      "Unable to insert into assignments: unknown schema (none of the candidate column sets worked).",
      "",
      "Observed errors (unique):",
      ...Array.from(new Set(errors)).slice(0, 12).map((e) => `- ${e}`),
    ].join("\n"),
  );
}

function moduleCopy(title: string) {
  return {
    moduleDescription: [
      "O objetivo não é informação: é forma mental.",
      "Leia com rigor. Reescreva com parcimônia. Repita até fixar.",
    ].join(" "),
    textLesson: {
      title: "Leitura dirigida (texto)",
      content: [
        "Não há retórica sem ordem interior.",
        "Antes de falar, o orador decide: o que quer produzir; em quem; por quais meios.",
        "Tome um tema simples e aplique três operações: delimitar, ordenar, concluir.",
        "",
        "Exercício de disciplina:",
        "- Escreva a tese em uma frase.",
        "- Escreva duas razões independentes.",
        "- Escreva uma objeção forte.",
        "- Responda à objeção em uma frase.",
      ].join("\n"),
    },
    videoA: {
      title: `Aula em vídeo — Fundamentos de ${title}`,
      video_url: null as string | null,
    },
    videoB: {
      title: `Aula em vídeo — Aplicação Prática de ${title}`,
      video_url: null as string | null,
    },
    quizTitle: `Quiz — ${title}`,
    assignmentTitle: `Produção — ${title}`,
  };
}

function quizForModule(moduleTitle: string): {
  questions: {
    prompt: string;
    options: { id: string; label: string }[];
    correct_option_id: string;
  }[];
} {
  // 5 questions each, conceptual, serious tone.
  // Option ids remain stable so reruns keep deterministic correct answers.
  const A = { id: "a", label: "" };
  const B = { id: "b", label: "" };
  const C = { id: "c", label: "" };
  const D = { id: "d", label: "" };

  const q = (
    prompt: string,
    a: string,
    b: string,
    c: string,
    d: string,
    correct: "a" | "b" | "c" | "d",
  ) => ({
    prompt,
    options: [
      { ...A, label: a },
      { ...B, label: b },
      { ...C, label: c },
      { ...D, label: d },
    ],
    correct_option_id: correct,
  });

  switch (moduleTitle) {
    case "Estrutura Mental":
      return {
        questions: [
          q(
            "Qual é a finalidade primária da retórica, no sentido clássico?",
            "Entreter uma audiência por meio de ornamentos",
            "Vencer por qualquer meio, independentemente da verdade",
            "Produzir ação racional mediante palavra ordenada",
            "Exibir erudição como prova de superioridade",
            "c",
          ),
          q(
            "O que caracteriza a fala deliberada (em contraste com a fala reativa)?",
            "É mais longa e emocional",
            "É produto final de pensamento ordenado",
            "Depende de improviso absoluto",
            "Dispensa finalidade prática",
            "b",
          ),
          q(
            "Qual triagem melhor combate a prolixidade?",
            "Adicionar mais exemplos",
            "Substituir verbos por adjetivos",
            "Retirar o supérfluo e manter o necessário",
            "Evitar conclusões para não se comprometer",
            "c",
          ),
          q(
            "Entre atenção, intenção e direção, qual descreve 'definir o efeito a produzir'?",
            "Atenção",
            "Intenção",
            "Direção",
            "Memória",
            "b",
          ),
          q(
            "Qual é o primeiro gesto de disciplina antes de argumentar?",
            "Elevar o tom de voz",
            "Patentear a questão real em jogo",
            "Recitar autores clássicos",
            "Multiplicar premissas sem ordem",
            "b",
          ),
        ],
      };
    case "Invenção":
      return {
        questions: [
          q(
            "O que é inventio, no vocabulário clássico?",
            "Decoração verbal",
            "Heurística: descobrir argumentos relevantes",
            "Memorizar discursos prontos",
            "Imitar estilos alheios sem critério",
            "b",
          ),
          q(
            "Nos status causae, a pergunta 'o que é isto?' pertence a qual status?",
            "Conjectural",
            "Definicional",
            "Qualitativo",
            "Translativo",
            "b",
          ),
          q(
            "Qual critério elimina argumentos verdadeiros porém inúteis ao caso?",
            "Relevância",
            "Sonoridade",
            "Complexidade",
            "Ambiguidade",
            "a",
          ),
          q(
            "Qual via argumentativa compara alternativas para decidir a melhor?",
            "Causal",
            "Valorativa",
            "Comparativa",
            "Narrativa",
            "c",
          ),
          q(
            "Ao receber uma objeção, o procedimento clássico recomenda:",
            "Ignorar e avançar",
            "Perguntar qual status está em jogo",
            "Responder com ironia",
            "Trocar de assunto",
            "b",
          ),
        ],
      };
    case "Arranjo":
      return {
        questions: [
          q(
            "Dispositio é melhor descrita como:",
            "Acumular fatos sem ordem",
            "Arquitetura do discurso para guiar a mente do ouvinte",
            "Uso de figuras de linguagem",
            "Memorização de parágrafos",
            "b",
          ),
          q(
            "Na sequência clássica, qual parte divide o problema em pontos claros?",
            "Narratio",
            "Partitio",
            "Peroratio",
            "Exordium",
            "b",
          ),
          q(
            "Função psicológica central de uma boa estrutura:",
            "Aumentar esforço cognitivo",
            "Criar previsibilidade e reduzir esforço do ouvinte",
            "Substituir argumentos por emoção",
            "Eliminar a necessidade de transições",
            "b",
          ),
          q(
            "Transições bem feitas servem para:",
            "Enfeitar o texto",
            "Encerrar e abrir blocos com direção",
            "Evitar conclusão",
            "Trocar definição por metáfora",
            "b",
          ),
          q(
            "Qual peça neutraliza objeções antecipadamente?",
            "Confirmatio",
            "Refutatio",
            "Narratio",
            "Partitio",
            "b",
          ),
        ],
      };
    case "Estilo":
      return {
        questions: [
          q(
            "Na tradição clássica, estilo (elocutio) é:",
            "Decoração gratuita",
            "Ferramenta de precisão do pensamento",
            "Substituto de evidências",
            "Apenas escolha de sinônimos",
            "b",
          ),
          q(
            "Qual NÃO é uma das quatro virtudes clássicas da expressão?",
            "Clareza",
            "Propriedade",
            "Força",
            "Ambiguidade",
            "d",
          ),
          q(
            "A função de figuras (anáfora, antítese etc.) é:",
            "Ocultar relações entre ideias",
            "Intensificar ritmo e fixar relações",
            "Aumentar palavras sem ganho",
            "Substituir estrutura por efeito",
            "b",
          ),
          q(
            "Ritmo e cadência dependem principalmente de:",
            "Uso constante de frases longas",
            "Alternância consciente entre frases e pausas",
            "Evitar repetição sempre",
            "Eliminar qualquer variação",
            "b",
          ),
          q(
            "Decoro significa:",
            "Enfeite ornamental",
            "Adequação do registro ao contexto e audiência",
            "Uso de termos raros",
            "Humor constante",
            "b",
          ),
        ],
      };
    case "Memória":
      return {
        questions: [
          q(
            "Na retórica clássica, memória serve sobretudo para:",
            "Impressionar pela extensão do texto",
            "Sustentar continuidade e domínio sem dependência de notas",
            "Eliminar a necessidade de inventio",
            "Substituir ensaio por improviso",
            "b",
          ),
          q(
            "Uma prática coerente com a tradição mnemônica é:",
            "Repetição aleatória sem revisão",
            "Mapa mental/estrutura + repetição espaçada",
            "Apenas decorar palavras isoladas",
            "Evitar estrutura para não 'engessar'",
            "b",
          ),
          q(
            "Qual é o risco típico de memória mal treinada?",
            "Excesso de direção",
            "Perda de sequência e transições",
            "Excesso de clareza",
            "Argumentos mais fortes",
            "b",
          ),
          q(
            "Uma boa memorização prioriza:",
            "Ornamentos",
            "Ordem (partes) e pontos de apoio",
            "Vocabulário raro",
            "Ambiguidade estratégica",
            "b",
          ),
          q(
            "Qual gesto protege a memória durante a execução?",
            "Falar mais rápido",
            "Marcar transições e conclusões parciais",
            "Evitar pausas",
            "Improvisar a estrutura no momento",
            "b",
          ),
        ],
      };
    case "Entrega":
      return {
        questions: [
          q(
            "Actio/entrega é melhor definida como:",
            "Teatro sem conteúdo",
            "Execução corporal e vocal a serviço do sentido",
            "Substituir razões por emoção",
            "Ler sem olhar para a audiência",
            "b",
          ),
          q(
            "Qual prática favorece serenidade e autoridade?",
            "Evitar pausas",
            "Usar silêncio e ritmo consciente",
            "Falar em volume máximo",
            "Aumentar gestos aleatórios",
            "b",
          ),
          q(
            "A entrega deve ser julgada principalmente por:",
            "Quantidade de gestos",
            "Adequação ao objetivo e clareza percebida",
            "Quantidade de palavras",
            "Velocidade",
            "b",
          ),
          q(
            "Um sinal de entrega disciplinada é:",
            "Mudança constante de assunto",
            "Transições limpas e finalização de blocos",
            "Evitar contato visual sempre",
            "Tom monotônico para 'ser sério'",
            "b",
          ),
          q(
            "Qual afirmação é mais correta?",
            "Entrega compensa ausência de estrutura",
            "Entrega revela a estrutura já construída",
            "Entrega dispensa inventio",
            "Entrega é puramente estética",
            "b",
          ),
        ],
      };
    default:
      return {
        questions: [
          q(
            "Qual é a finalidade primária da retórica, no sentido clássico?",
            "Entreter",
            "Vencer por qualquer meio",
            "Produzir ação racional por palavra ordenada",
            "Exibir erudição",
            "c",
          ),
          q(
            "O que é inventio?",
            "Decoração",
            "Descoberta de argumentos",
            "Memorização",
            "Improviso",
            "b",
          ),
          q(
            "O que é dispositio?",
            "Arquitetura do discurso",
            "Vício de linguagem",
            "Apenas estilo",
            "Apenas memória",
            "a",
          ),
          q(
            "O que é elocutio?",
            "Precisão da expressão",
            "Gestos",
            "Volume",
            "Silêncio",
            "a",
          ),
          q(
            "Uma boa entrega depende de:",
            "Mais palavras",
            "Ritmo e adequação",
            "Jargão",
            "Pressa",
            "b",
          ),
        ],
      };
  }
}

async function main() {
  const course = await getOrCreateCourse({
    title: "Formação Retórica Clássica",
  });

  const moduleTitles = [
    "Estrutura Mental",
    "Invenção",
    "Arranjo",
    "Estilo",
    "Memória",
    "Entrega",
  ];

  for (let i = 0; i < moduleTitles.length; i++) {
    const title = moduleTitles[i]!;
    const copy = moduleCopy(title);

    const mod = await getOrCreateModule({
      course_id: course.id,
      order_index: i, // strict progression uses order_index starting at 0
      title,
    });

    // Lessons: 1 text + 2 video placeholders
    await getOrCreateLesson({
      module_id: mod.id,
      order_index: 1,
      title: copy.textLesson.title,
    });
    await getOrCreateLesson({
      module_id: mod.id,
      order_index: 2,
      title: copy.videoA.title,
    });
    await getOrCreateLesson({
      module_id: mod.id,
      order_index: 3,
      title: copy.videoB.title,
    });

    // Quiz + questions
    const quiz = await getOrCreateQuiz({
      module_id: mod.id,
    });

    const { questions } = quizForModule(title);
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const question = questions[qIdx]!;
      await upsertQuizQuestion({
        quiz_id: quiz.id,
        prompt: question.prompt,
        options: question.options,
        correct_option_id: question.correct_option_id,
      });
    }

    // Assignment
    await getOrCreateAssignment({
      module_id: mod.id,
      title: copy.assignmentTitle,
      prompt: [
        "Escreva um parágrafo argumentativo (150–250 palavras).",
        "Regras:",
        "1) tese explícita na primeira frase;",
        "2) duas razões independentes;",
        "3) uma objeção forte e sua resposta;",
        "4) conclusão curta e inevitável.",
      ].join("\n"),
    });
  }

  console.log("Seed completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

