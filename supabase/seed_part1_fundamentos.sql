-- Seed: Fundamentos (Module 1) - Lessons 1-8
-- Theoretical content from "As Armas da Palavra" source documents

INSERT INTO liceu_theoretical_content (id, lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references, word_count) VALUES
('1a2b3c4d-0001-0000-0000-000000000001', '32099302-155a-45d7-b5b4-62bfeeea8e6a', 1, 'Retórica como Tecnologia Mental',
'# Retórica como Tecnologia da Mente

A retórica não é ornamento. É arquitetura cognitiva.

## O problema central

Grande parte dos problemas de comunicação no ambiente profissional não nasce da falta de conhecimento, nem da ausência de boa intenção. Nasce da interferência constante de ruídos cognitivos que deformam o pensamento antes mesmo de ele chegar à palavra.

Esses ruídos não são erros ocasionais. São padrões recorrentes, muitas vezes invisíveis para quem os pratica, mas imediatamente perceptíveis para quem escuta. Eles consomem energia mental, reduzem a clareza, comprometem decisões e corroem a autoridade ao longo do tempo.

## A tríade clássica como matriz de raciocínio

Inventio, dispositio e elocutio não são etapas lineares. São dimensões simultaneamente ativas da mente que se aplica ao dizer. Aplicá-las a vendas, liderança e negociação não é metáfora — é extensão direta do modelo clássico.

## Paideia: formação pela estrutura da fala

A paideia (Jaeger) é a formação do homem pela estruturação de sua fala. Não se forma um orador apenas ensinando técnicas. Forma-se um orador disciplinando a mente que as contém.',
ARRAY['retórica', 'tecnologia mental', 'paideia', 'ruídos cognitivos'],
jsonb_build_object('cicero', 'De Oratore I', 'quintiliano', 'Inst. Orat. I.1-2', 'ad herennium', 'Book I'),
380),

('1a2b3c4d-0001-0000-0000-000000000002', '24eeb8bf-c11b-415c-b0b7-53a884834d8b', 1, 'Atenção, Intenção e Presença',
'# Atenção, Intenção e Presença

Antes de inventio, dispositio, elocutio, há três preámbulos cognitivos.

## Atenção

Saber o que está tentando ser feito. A mente dispersa produz palavra dispersa. A atenção é o primeiro ato da vontade discursiva.

## Intenção

Definir o propósito da fala. Toda comunicação sem intenção clara é reação, não ação. A intenção determina a estrutura.

## Presença

Estar no momento, sem distrações. A presença não é ausência de nervosismo — é direção da energia para o propósito.',
ARRAY['atenção', 'intenção', 'presença', 'disciplina'],
jsonb_build_object('quintiliano', 'Inst. Orat. II.12', 'ad herennium', 'Book I, Ch. 1'),
290),

('1a2b3c4d-0001-0000-0000-000000000003', 'c14e8672-2893-4cf4-bca6-4e10ee7286b1', 1, 'Paideia: Formar o Homem pela Forma',
'# Paideia: Formar o Homem pela Forma do Discurso

## O homem que sabe falar

Quintiliano afirma que o orador é um "homem bom que sabe falar" — *vir bonus dicendi peritus*. A técnica requer mente disciplinada. Não basta dominar as armas da linguagem se a estrutura cognitiva estiver desordenada.

## A formação como arquitetura

A paideia é a formação do homem pela estruturação de sua fala. Cada exercício retórico não apenas melhora a comunicação — ele modela o pensamento.

## Disciplina intelectual

A disciplina do estudo como preparação do terreno intelectual (Olavo, "organização dos estudos"). Estudar não é decorar. É treinar a mente para a clareza.',
ARRAY['paideia', 'formação', 'disciplina', 'clareza'],
jsonb_build_object('quintiliano', 'Inst. Orat. I.1', 'jaeger', 'Paideia'),
320),

('1a2b3c4d-0001-0000-0000-000000000004', '5128fa3b-e0d4-4ef7-ac73-c3030973f129', 1, 'Disciplina Intelectual e Economia Mental',
'# Disciplina Intelectual e Economia Mental

## A economia do discurso

No Ad Herennium, lê-se que o objetivo da retórica é transmitir o pensamento "com rapidez, clareza e distinção". Esta clareza não é um dom — é uma disciplina.

## A disciplina do estudo

Organizar o estudo não é burocracia. É treino cognitivo. Quem estuda sem sistema não está estudando — está se entreter com livros.

## Compressão mental

Transformar uma explicação longa em três frises essenciais. Esta não é simplificação — é extração de estrutura. O que sobra após a compressão é a espinha dorsal do pensamento.',
ARRAY['disciplina', 'economia mental', 'compressão', 'clareza'],
jsonb_build_object('ad herennium', 'Book I', 'quintiliano', 'Inst. Orat. II'),
280),

('1a2b3c4d-0001-0000-0000-000000000005', 'fe89d4dd-9179-426c-b5aa-c507424feb10', 1, 'Ruídos Cognitivos na Comunicação Profissional',
'# Ruídos Cognitivos na Comunicação Profissional

## O inimigo interno

A maioria dos problemas de comunicação não nasce da falta de conhecimento, mas da interferência constante de ruídos cognitivos. Eles deformam o pensamento antes mesmo de ele chegar à palavra.

## Os três principais ruídos

### 1. Ansiedade comunicativa
Traz a fala para o subjetivo e a faz defensiva. O orador perde a autoridade ao admitir incertezas.

### 2. Prolixidade
É o excesso de informação sob o pretexto de "não faltar nada". A mente dispersa, a audiência confusa.

### 3. Pressa argumentativa
Pular da definição para a defesa. A estrutura se desfaz. Argumentos sem base.

## O antídoto: a disciplina do foco

Antes de qualquer argumento, há a pergunta: "O que importa aqui?" Esta pergunta não é retórica — é operadora.',
ARRAY['ruídos cognitivos', 'ansiedade', 'prolixidade', 'foco'],
jsonb_build_object('quintiliano', 'Inst. Orat. II.12', 'ad herennium', 'Book I'),
340);

-- Flashcards for Fundamentos
INSERT INTO liceu_flashcards (id, lesson_id, front, back, rhetorical_dimension, archetype_key, is_published) VALUES
('fc-0001-0000-0000-0000-00000000001', '32099302-155a-45d7-b5b4-62bfeeea8e6a',
'O que é a paideia segundo Jaeger?',
'Formação do homem pela estruturação de sua fala — não se forma um orador apenas com técnicas, mas disciplinando a mente.',
'memoria', 'orador', true),

('fc-0001-0000-0000-0000-00000000002', 'fe89d4dd-9179-426c-b5aa-c507424feb10',
'Quais são os três ruídos cognitivos principais?',
'Ansiedade comunicativa, prolixidade, e pressa argumentativa.',
'inventio', 'diagnóstico', true);

-- Exercises for Fundamentos
INSERT INTO liceu_exercises (id, lesson_id, type, prompt, solution_hint, is_published) VALUES
('ex-0001-0000-0000-0000-00000000001', 'fe89d4dd-9179-426c-b5aa-c507424feb10',
'identificacao',
'Veja este texto: "Precisamos melhorar nossos processos, mas estão todos cansados." Identifique os ruídos cognitivos presentes.',
'Ansiedade (admisão de fraqueza), prolixidade (informação dispersa), pressa (sem estrutura).',
true);
