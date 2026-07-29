-- Seed: Dispositio (Module 3) - Lessons 17-23
INSERT INTO liceu_theoretical_content (id, lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references, word_count) VALUES
('3a2b3c4d-0003-0000-0000-000000000017', 'cb82f35a-053f-4b04-9773-77980fe199ff', 1, 'As Partes do Discurso Clássico',
'# As Partes do Discurso Clássico

## As seis partes segundo Cícero

1. **Exordium** — Abertura. Estabelece etos e conexão com a audiência.
2. **Narratio** — Contextualização. Apresenta o cenário e os fatos.
3. **Partitio** — Divisão. Mostra como o problema será tratado.
4. **Confirmatio** — Argumentação. Desenvolvimento principal.
5. **Refutatio** — Contra-argumentação. Antecipa objeções.
6. **Peroratio** — Conclusão. Apela à emoção e finaliza com força.

## Aplicação moderna

Estas partes não são rígidas. Mas ignorá-las é como construir sem fundação.',
ARRAY['exordium', 'narratio', 'partitio', 'confirmatio', 'refutatio', 'peroratio'],
jsonb_build_object('cicero', 'De Oratore I.115', 'ad herennium', 'Book I'),
280),

('3a2b3c4d-0003-0000-0000-000000000018', '758e13ad-8d77-4756-bc9a-106b3e80298e', 1, 'Ordem, Progressão e Inevitabilidade',
'# Ordem, Progressão e Inevitabilidade

## A ordem como força persuasiva

A ordem dos argumentos não é neutra. O primeiro argumento é o mais memorável. O último é o mais influente.

## A progressão lógica

Cada argumento deve fluir naturalmente do anterior. Saltos quebram o ritmo da mente.',
ARRAY['ordem', 'progressão', 'inevitabilidade'],
jsonb_build_object('cicero', 'De Oratore I.115'),
240),

('3a2b3c4d-0003-0000-0000-000000000019', '5e087443-2c23-4cf5-9833-e680edb10be3', 1, 'Diferença entre Explicar, Argumentar e Persuadir',
'# Diferença entre Explicar, Argumentar e Persuadir

## Explicar
Transmite informação. A audiência aprende.

## Argumentar
Defende uma posição. A audiência é convencida.

## Persuadir
Mobiliza para ação. A audiência muda de comportamento.

## A transição

Cada nível inclui o anterior, mas vai além.',
ARRAY['explicar', 'argumentar', 'persuadir'],
jsonb_build_object('cicero', 'De Oratore I', 'quintiliano', 'Inst. Orat. II'),
260),

('3a2b3c4d-0003-0000-0000-000000000020', '665ceac7-dedb-43a9-9e2a-b6057f228ccf', 1, 'Estruturar Reuniões, Apresentações e Negociações',
'# Estruturar Reuniões, Apresentações e Negociações

## A estrutura clássica em contextos modernos

Uma reunião bem estruturada segue o padrão clássico:
- Exordium: "Por que estamos aqui?"
- Narratio: "Qual é a situação atual?"
- Partitio: "Como vamos resolver?"
- Confirmatio: "Aqui está minha proposta."
- Refutatio: "Antes que você diga X, deixe-me responder."
- Peroratio: "Este é o próximo passo."',
ARRAY['estrutura', 'reunião', 'apresentação', 'negociação'],
jsonb_build_object('cicero', 'De Oratore I.115'),
270),

('3a2b3c4d-0003-0000-0000-000000000021', 'e8452b35-3e75-44c2-a439-2287accb5ca9', 1, 'Síntese Vertical e Hierarquia de Ideias',
'# Síntese Vertical e Hierarquia de Ideias

## A síntese não é resumo

Síntese é extração de estrutura. Resumo é repetição de conteúdo.

## A hierarquia de ideias

Nem todas as ideias são iguais. Algumas são fundamentais. Outras são suporte.

## A técnica

1. Identifique a ideia principal
2. Subsídias ela com duas ideias secundárias
3. Elimine o resto',
ARRAY['síntese', 'hierarquia', 'compressão'],
jsonb_build_object('quintiliano', 'Inst. Orat. II.12'),
250),

('3a2b3c4d-0003-0000-0000-000000000022', '24eeb8bf-c11b-415c-b0b7-53a884834d8b', 1, 'Atenção, Intenção e Presença na Estrutura',
'# Atenção, Intenção e Presença na Estrutura

## A estrutura como expressão de atenção

Organizar a fala é organizar a mente. A estrutura clássica não é um molde — é um espelho da clareza interna.',
ARRAY['atenção', 'intenção', 'presença', 'estrutura'],
jsonb_build_object('quintiliano', 'Inst. Orat. I'),
220),

('3a2b3c4d-0003-0000-0000-000000000023', '2cfe1feb-48f1-476d-89e5-d10513c5a603', 1, 'Quando a Forma Pede Escolha de Palavras',
'# Quando a Forma Pede Escolha de Palavras

## A transição para oocutio

A dispositio gera estrutura. A elocutio escolhe as palavras.

## A escolha como precisão

Cada palavra deve ser escolhida por três critérios:
1. **Propriedade** — é a palavra certa para o conceito?
2. **Clareza** — o interlocutor entenderá?
3. **Força** — a palavra tem o impacto necessário?

## A economia da escolha

Não se escolhe a palavra mais bonita. Escolhe-se a que cumpre o propósito.',
ARRAY['elocutio', 'escolha', 'propriedade', 'clareza'],
jsonb_build_object('cicero', 'De Oratore I.115', 'quintiliano', 'Inst. Orat. II'),
290);

-- Exercises for Dispositio
INSERT INTO liceu_exercises (id, lesson_id, type, prompt, solution_hint, is_published) VALUES
('ex-0003-0000-0000-0000-00000000001', 'cb82f35a-053f-4b04-9773-77980fe199ff',
'producao',
'Reescreva este pitch usando as seis partes do discurso clássico: "Temos um software novo que resolve problemas de produtividade."',
'Exordium: "Como vocês lidam com perda de foco diária?" Narratio: "73% dos profissionais perdem 2h/dia com interrupções." Partitio: "Vou mostrar como em 3 pontos." Confirmatio: "1) Detecção automática 2) Priorização inteligente 3) Integração contínua" Refutatio: "Não é mais um app — é sistema operacional." Peroratio: "Testem 7 dias. Sua produtividade agradece."',
true);
