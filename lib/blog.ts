export type BlogPost = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  content: string;
};

export const POSTS: BlogPost[] = [
  {
    slug: "estrutura-antes-da-fala",
    title: "Estrutura antes da fala",
    date: "2026-03-17",
    content: [
      "A fala é efeito. A causa é a ordem interna.",
      "",
      "O erro recorrente do profissional inteligente é tentar construir a estrutura no instante da cobrança. Sob pressão, a mente busca rotas fáceis: prolixidade, defesa emocional, fuga para detalhes. O resultado é confusão.",
      "",
      "A solução não é “melhor oratória”. É arquitetura prévia: tese, razões, objeção forte, resposta curta. Quando isso existe antes da arena, a execução é simples.",
    ].join("\n"),
  },
  {
    slug: "silencio-e-autoridade",
    title: "Silêncio e autoridade",
    date: "2026-03-17",
    content: [
      "A autoridade não nasce do volume. Nasce do corte.",
      "",
      "O silêncio não é ausência de pensamento. É marca de domínio: você conclui um bloco, pausa, e obriga o ambiente a acompanhar a estrutura.",
      "",
      "Quem fala sem parar tenta compensar uma fragilidade: não saber onde está. Quem fala pouco, com forma, dita o ritmo.",
    ].join("\n"),
  },
];

export function getPost(slug: string): BlogPost | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}

