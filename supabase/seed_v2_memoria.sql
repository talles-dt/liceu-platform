-- Seed: Memoria content (lessons 31-36)
INSERT INTO liceu_theoretical_content (lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references) VALUES
('71df4c99-c24f-4d8b-91c4-407411865812', 1, 'Memória como Estrutura Viva do Discurso',
'# Memória como Estrutura Viva do Discurso

## A memória não é decorar

A memória retórica não é memorizar textos. É memorizar estruturas.

## O método da arquitetura

A memória se baseia em lugares. Não em palavras.

## A técnica

1. Associe cada argumento a um local visual
2. Crie uma narrativa que conecte os locais
3. Releia mentalmente a jornada antes de falar',
ARRAY['memória', 'arquitetura', 'associação'],
'{"cicero": "De Oratore I.115", "quintiliano": "Inst. Orat. II"}'),

('50ced7dc-fd1e-43f7-8889-f238d0e8554a', 1, 'Retórica como Hábito, Não Evento',
'# Retórica como Hábito, Não Evento

## A repetição como formação

Praticar retórica não é um evento. É um hábito.

## A rotina mínima

5 minutos por dia valem mais que 5 horas uma vez por semana.',
ARRAY['hábito', 'repetição', 'rotina'],
'{"quintiliano": "Inst. Orat. II"}'),

('1b6e97c2-2530-4cf5-b545-cf487f74de42', 1, 'Preparo, Julgamento e Improviso Consciente',
'# Preparo, Julgamento e Improviso Consciente

## O improviso não é ausência de preparo

Improvisar é aplicar estrutura sob pressão.

## A diferença

- **Preparo** — estrutura memorizada
- **Julgamento** — escolha do momento certo
- **Improviso** — aplicação adaptada',
ARRAY['preparo', 'julgamento', 'improviso'],
'{"cicero": "De Oratore I.115"}'),

('9d1ba104-64b6-4afe-ab8b-5b364dbe5c12', 1, 'Aplicações Centrais: Negociação, Liderança, Conflito e Decisão',
'# Aplicações Centrais: Negociação, Liderança, Conflito e Decisão

## Negociação
Estrutura clássica para propostas: exordium (contexto), confirmatio (proposta), peroratio (call-to-action).

## Liderança
Comunicação de visão: narratio (situação), partitio (plano), confirmatio (benefícios).

## Conflito
Mediação: exordium (neutralidade), narratio (fatos), refutatio (contra-argumentos).

## Decisão
Apresentação para decisão: claridade absoluta, estrutura impecável.',
ARRAY['negociação', 'liderança', 'conflito', 'decisão'],
'{"cicero": "De Oratore I.115"}'),

('73826b8a-8ea2-4247-a69a-9b31494d63c7', 1, 'Rotina Mínima de Treino Retórico',
'# Rotina Mínima de Treino Retórico

## Cinco minutos por dia

1. **Compressão** — reduza um texto a 3 frases
2. **Reconstrução** — estrutura clássica
3. **Reescrita** — figuras retóricas
4. **Recitação** — voz e pausas
5. **Reflexão** — autoavaliação',
ARRAY['rotina', 'treino', 'compressão'],
'{"quintiliano": "Inst. Orat. II"}'),

('a9118d74-37d7-4376-b281-5171c1efd540', 1, 'Plano Pessoal de Desenvolvimento Retórico',
'# Plano Pessoal de Desenvolvimento Retórico

## Autoavaliação

1. Qual sua maior falha de comunicação?
2. Qual técnica clássica pode corrigi-la?
3. Como praticar diariamente?

## O plano

- Mês 1: Fundamentos (atenção, intenção, presença)
- Mês 2: Inventio (perguntas, status causae)
- Mês 3: Dispositio (estrutura clássica)
- Mês 4: Elocutio (escolha de palavras)
- Mês 5: Memória (retenção e recuperação)
- Mês 6: Integração (aplicação completa)',
ARRAY['plano', 'desenvolvimento', 'autoavaliação'],
'{"quintiliano": "Inst. Orat. I"}');

-- Exercises for Memoria
INSERT INTO liceu_exercises (lesson_id, exercise_type, title, prompt_markdown, expected_answer, is_published) VALUES
('71df4c99-c24f-4d8b-91c4-407411865812',
'production',
'Crie um palácio da memória',
'Crie um "palácio da memória" para reter os três argumentos principais de um pitch de 2 minutos.',
jsonb_build_object('answer', 'Use um local familiar (sua casa). Associe argumento 1 ao portão, argumento 2 à mesa de jantar, argumento 3 ao sofá.'),
true);
