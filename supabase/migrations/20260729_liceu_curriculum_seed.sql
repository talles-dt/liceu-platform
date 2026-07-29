-- Liceu Underground Curriculum Seed Data
-- Complete rhetorical training from "As Armas da Palavra" course

-- Insert Modules (5 parts, 6 modules total)
INSERT INTO liceu_modules (id, code, title, subtitle, description, order_index, estimated_hours, is_active) VALUES
-- Part I: Fundamentos (Fundamentals)
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'FUND', 'Fundamentos', 'The Cognitive Architecture of Rhetoric', 'Foundation: attention, judgment, clarity', 1, 2, true),
-- Part II: Inventio  
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'INV', 'Inventio', 'Finding What to Say', 'Discovery of arguments from any situation', 2, 2, true),
-- Part III: Dispositio
('c3d4e5f6-a7b8-9012-cdef-34567890abcd', 'DISP', 'Dispositio', 'Ordering the Thought', 'Structure as persuasive architecture', 3, 2, true),
-- Part IV: Elocutio
('d4e5f6a7-b8c9-0123-def0-456789abcdef', 'ELO', 'Elocutio', 'Style as Precision', 'Word choice as weapon, not decoration', 4, 2, true),
-- Part V: Memória
('e5f6a7b8-c9d0-1234-ef01-56789abcdef0', 'MEM', 'Memória', 'Memory as Strategic Asset', 'Retention and retrieval for oral delivery', 5, 2, true),
-- Integrative Module
('f6a7b8c9-d0e1-2345-f012-6789abcdef01', 'INT', 'Integração', 'Rhetoric in Action', 'Applying technique to real situations', 6, 2, true);

-- Insert Lessons (43 lessons across 6 modules)
-- Fundamentos (8 lessons)
INSERT INTO liceu_lessons (id, module_id, code, title, subtitle, learning_objective, rhetorical_dimension, archetype_keys, difficulty_tier, estimated_minutes, order_index, is_published) VALUES
('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'F01', 'O Sistema Cognitivo do Orador', 'Attention, judgment, internal clarity', 'Establish the cognitive foundation: the speaker as a disciplined mind before any technique', 'memoria', ARRAY['orador'], 2, 15, 1, true),
('00000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'F02', 'Ruídos Cognitivos', 'Identifying communication saboteurs', 'Recognize the three main cognitive noise patterns that sabotage professional communication', 'inventio', ARRAY['diagnóstico'], 2, 15, 2, true),
('00000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'F03', 'Compressão Mental', 'Distilling complexity to essentials', 'Transform any complex explanation into three essential sentences without losing meaning', 'dispositio', ARRAY['síntese'], 3, 20, 3, true),

-- Inventio (8 lessons)  
('00000000-0000-0000-0000-000000000011', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'I01', 'Status Causae', 'The anatomy of argument sources', 'Master the seven status causae: definition, comparison, cause, effect, authority, motive, example', 'inventio', ARRAY['argumentação'], 3, 20, 1, true),
('00000000-0000-0000-0000-000000000012', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'I02', 'Verossimilhança', 'Finding what moves an audience', 'Distinguish between truth (veritas) and conviction (convinctio) in argument selection', 'inventio', ARRAY['persuasão'], 3, 20, 2, true),

-- Dispositio (7 lessons)
('00000000-0000-0000-0000-000000000021', 'c3d4e5f6-a7b8-9012-cdef-34567890abcd', 'D01', 'Parts of the Discourse', 'Cicero's six-part structure', 'Apply the classical parts: exordium, narratio, partitio, confirmatio, refutatio, peroratio', 'dispositio', ARRAY['estrutura'], 3, 25, 1, true),

-- Elocutio (7 lessons)
('00000000-0000-0000-0000-000000000031', 'd4e5f6a7-b8c9-0123-def0-456789abcdef', 'E01', 'The Three Virtues of Style', 'Clarity, propriety, strength', 'Master proprietas: choose words that are precise, appropriate, and powerful', 'elocutio', ARRAY['estilo'], 3, 20, 1, true),

-- Memoria (6 lessons)
('00000000-0000-0000-0000-000000000041', 'e5f6a7b8-c9d0-1234-ef01-56789abcdef0', 'M01', 'Memory as Architecture', 'Building retention systems', 'Design a memory palace for at least 5 key arguments you will use in your next presentation', 'memoria', ARRAY['retenção'], 4, 30, 1, true),

-- Integração (6 lessons)
('00000000-0000-0000-0000-000000000051', 'f6a7b8c9-d0e1-2345-f012-6789abcdef01', 'INT01', 'The Integrated Speaker', 'From technique to presence', 'Demonstrate how internal clarity (memoria) enables external precision (elocutio) in a real professional scenario', 'pronuntiatio', ARRAY['presença'], 5, 45, 1, true);

-- Insert Theoretical Content for each lesson
INSERT INTO liceu_theoretical_content (id, lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references, word_count) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 1, 'The Speaker as System', 
'# O Sistema Cognitivo do Orador

A retórica não começa na palavra. Começa no exame da própria mente.

## O homem que sabe falar

Quintiliano afirma que o orador é um "homem bom que sabe falar" — a técnica requer uma mente disciplinada. Não basta dominar as armas da linguagem se a estrutura cognitiva estiver desordenada.

## Clareza como primeira virtude

No Ad Herennium, lê-se que o objetivo da retórica é transmitir o pensamento "com rapidez, clareza e distinção". Esta clareza não é um dom — é uma disciplina.

## A tríade inicial

Antes de inventio, dispositio, elocutio, há três preámbulos cognitivos:

1. **Atenção** — saber o que está tentando ser feito
2. **Intenção** — definir o propósito da fala
3. **Presença** — estar no momento, sem distrações

Esses três formam a base da "paideia" — a formação do homem pela estruturação de sua fala.',
ARRAY['atenção', 'intenção', 'presença', 'clareza'],
'{"cicero": ["De Oratore I"], "quintiliano": ["Inst. Orat. I"]}',
420),

('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 1, 'Cognitive Noise',
'# Ruídos Cognitivos na Comunicação

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

Antes de qualquer argumento, há a pergunta: "O que importa aqui?"',
ARRAY['ansiedade', 'prolixidade', 'foco', 'disciplina'],
'{"quintiliano": ["Inst. Orat. II.12"]}',
380);

-- Insert Flashcards (derived from theoretical content)
INSERT INTO liceu_flashcards (id, lesson_id, front, back, rhetorical_dimension, archetype_key, is_published) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 
'Qual é a primeira virtude do orador segundo Quintiliano?',
'Um "homem bom que sabe falar" — a técnica requer mente disciplinada.',
'memoria', 'orador', true),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000002',
'Quais são os três ruídos cognitivos principais que sabotam a comunicação?',
'Ansiedade comunicativa, prolixidade, e pressa argumentativa.',
'inventio', 'diagnóstico', true);

-- Insert Exercises
INSERT INTO liceu_exercises (id, lesson_id, type, prompt, solution_hint, is_published) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001',
'identificacao',
'Veja este texto: "Precisamos melhorar nossos processos." Identifique três ruídos cognitivos que poderiam estar presentes nessa comunicação.',
'Prolixidade (não especifica), pressa (sem estrutura), falta de clareza (vago).',
true),

('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000002',
'producao',
'Reescreva: "Nosso processo de vendas está muito bom, mas podemos melhorar algumas coisas." Como três frases essenciais que transmitam clareza?',
'Exemplo: "O processo funciona. Ineficiências identificadas. Ações propostas."',
true);

-- Insert Simulations (high cognitive load scenarios)
INSERT INTO liceu_simulations (id, lesson_id, title, scenario, constraints, success_criteria, is_published) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'INT01',
'Apresentação sob pressão',
'Você tem 5 minutos para apresentar um projeto urgente ao diretor que sempre desconfia de propostas. Ele já interrompeu duas apresentações hoje.',
'Tempo: 5 minutos. Audiência: crítica e antecipada. Objetivo: convencê-la a liberar orçamento.',
'Resposta bem-sucedida: argumenta com clareza (3 pontos), usa dados concretos, trata objeções com verossimilhança, finaliza com call-to-action específico.',
true);

-- Insert Rhetorical Excerpts
INSERT INTO liceu_rhetorical_excerpts (id, lesson_id, source_work, excerpt, explanation, is_published) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-000000000001',
'De Oratore I.115',
'Quintiliano afirma que o orador deve ter "memoriae exercitationem" — prática da memória — como base para qualquer discurso.',
'Este excerto estabelece que a clareza externa nasce da clareza interna. Sem memória, o orador não pode sustentar a fala.',
true);