-- Seed: Fundamentos - Only lessons WITHOUT existing content
-- Lessons 1 and 2 already have content, skip them
-- Insert content for lessons 3-8 (fe89d4dd, 24eeb8bf, c14e8672, 5128fa3b)

INSERT INTO liceu_theoretical_content (lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references) VALUES
('24eeb8bf-c11b-415c-b0b7-53a884834d8b', 1, 'Atenção, Intenção e Presença',
'# Atenção, Intenção e Presença

Antes de inventio, dispositio, elocutio, há três preámbulos cognitivos.

## Atenção
Saber o que está tentando ser feito. A mente dispersa produz palavra dispersa. A atenção é o primeiro ato da vontade discursiva.

## Intenção
Definir o propósito da fala. Toda comunicação sem intenção clara é reação, não ação. A intenção determina a estrutura.

## Presença
Estar no momento, sem distrações. A presença não é ausência de nervosismo — é direção da energia para o propósito.',
ARRAY['atenção', 'intenção', 'presença', 'disciplina'],
'{"quintiliano": "Inst. Orat. II.12", "ad herennium": "Book I, Ch. 1"}'),

('c14e8672-2893-4cf4-bca6-4e10ee7286b1', 1, 'Paideia: Formar o Homem pela Forma',
'# Paideia: Formar o Homem pela Forma do Discurso

## O homem que sabe falar

Quintiliano afirma que o orador é um "homem bom que sabe falar" — *vir bonus dicendi peritus*. A técnica requer mente disciplinada. Não basta dominar as armas da linguagem se a estrutura cognitiva estiver desordenada.

## A formação como arquitetura

A paideia é a formação do homem pela estruturação de sua fala. Cada exercício retórico não apenas melhora a comunicação — ele modela o pensamento.

## Disciplina intelectual

A disciplina do estudo como preparação do terreno intelectual (Olavo, "organização dos estudos"). Estudar não é decorar. É treinar a mente para a clareza.',
ARRAY['paideia', 'formação', 'disciplina', 'clareza'],
'{"quintiliano": "Inst. Orat. I.1", "jaeger": "Paideia"}'),

('5128fa3b-e0d4-4ef7-ac73-c3030973f129', 1, 'Disciplina Intelectual e Economia Mental',
'# Disciplina Intelectual e Economia Mental

## A economia do discurso

No Ad Herennium, lê-se que o objetivo da retórica é transmitir o pensamento "com rapidez, clareza e distinção". Esta clareza não é um dom — é uma disciplina.

## A disciplina do estudo

Organizar o estudo não é burocracia. É treino cognitivo. Quem estuda sem sistema não está estudando — está se entreter com livros.

## Compressão mental

Transformar uma explicação longa em três frases essenciais. Esta não é simplificação — é extração de estrutura.',
ARRAY['disciplina', 'economia mental', 'compressão', 'clareza'],
'{"ad herennium": "Book I", "quintiliano": "Inst. Orat. II"}'),

('fe89d4dd-9179-426c-b5aa-c507424feb10', 1, 'Ruídos Cognitivos na Comunicação Profissional',
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

## O antídote: a disciplina do foco

Antes de qualquer argumento, há a pergunta: "O que importa aqui?" Esta pergunta não é retórica — é operadora.',
ARRAY['ruídos cognitivos', 'ansiedade', 'prolixidade', 'foco'],
'{"quintiliano": "Inst. Orat. II.12", "ad herennium": "Book I"}');

-- Flashcards for Fundamentos (only new ones)
INSERT INTO liceu_flashcards (lesson_id, front, back, rhetorical_dimension, archetype_keys, is_published) VALUES
('fe89d4dd-9179-426c-b5aa-c507424feb10',
'Quais são os três ruídos cognitivos principais?',
'Ansiedade comunicativa, prolixidade, e pressa argumentativa.',
'inventio', ARRAY['diagnóstico'], true);

-- Exercises for Fundamentos
INSERT INTO liceu_exercises (lesson_id, exercise_type, prompt_markdown, expected_answer, is_published) VALUES
('fe89d4dd-9179-426c-b5aa-c507424feb10',
'identificacao',
'Veja este texto: "Precisamos melhorar nossos processos, mas estão todos cansados." Identifique os ruídos cognitivos presentes.',
jsonb_build_object('answer', 'Ansiedade (admisão de fraqueza), prolixidade (informação dispersa), pressa (sem estrutura).'),
true);
