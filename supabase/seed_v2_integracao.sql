-- Seed: Integracao content (lessons 37-43)
INSERT INTO liceu_theoretical_content (lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references) VALUES
('fd5ec4ff-ef0f-4d96-97cd-e18a6d49f6bb', 1, 'A Palavra como Gesto Completo',
'# A Palavra como Gesto Completo: Integração das Três Artes

## As três artes da fala

1. **Inventio** — o que dizer
2. **Dispositio** — como organizar
3. **Elocutio** — como dizer

## A integração

Nenhuma arte funciona sozinha. A palavra é um gesto completo — pensamento, estrutura e forma em um.

## A presença

A presença (pronuntiatio) não é decorar gestos. É a manifestação física da clareza interna.',
ARRAY['integração', 'presença', 'pronuntiatio'],
'{"cicero": "De Oratore I.115", "quintiliano": "Inst. Orat. II"}'),

('59e98164-c5e7-45f7-a714-4178e9ea899f', 1, 'Respiração e Sustentação Vocal',
'# Respiração e Sustentação Vocal

## A base física da fala

A voz precisa de ar. A respiração precisa de disciplina.

## A técnica

1. Respiração diafragmática
2. Sustentação contínua
3. Controle de pressão

## A conexão com a retórica

Uma voz mal sustentida enfraquece o argumento. A técnica vocal é técnica retórica.',
ARRAY['respiração', 'voz', 'sustentação'],
'{"cicero": "De Oratore I.115"}'),

('184b2c47-ceef-4cea-b199-0d0889157ac8', 1, 'Articulação e Dicção Precisa',
'# Articulação e Dicção Precisa

## A clareza faz parte do conteúdo

Se a audiência não entende a palavra, o argumento morre.

## A técnica

1. Abra a boca — não fale pelo nariz
2. Separe as palavras — não junte
3. Acelere no final — não no início',
ARRAY['articulação', 'dicção', 'clareza'],
'{"quintiliano": "Inst. Orat. II"}'),

('c746f038-eae2-40e3-a802-1ec99b4437b4', 1, 'Prosódia: Ritmo, Pausa e Entonação',
'# Prosódia: Ritmo, Pausa e Entonação

## A música da fala

O ritmo, a pausa e a entonação não são "toque de mágica". São ferramentas retóricas.

## A técnica

- **Ritmo** — varia para manter atenção
- **Pausa** — permite a ideia respirar
- **Entonação** — guia a audiência pelo significado',
ARRAY['prosódia', 'ritmo', 'pausa', 'entonação'],
'{"cicero": "De Oratore I.115"}'),

('b95aab92-b337-4094-b8a6-4b755ea89708', 1, 'Gestualidade Retórica e Presença Cênica',
'# Gestualidade Retórica e Presença Cênica

## O gesto como extensão do argumento

Um gesto bem colocado não é teatro. É reforço visual do que a palavra diz.

## A regra

1. Gestos naturais — sigam o pensamento
2. Gestos contidos — não exagerar
3. Gestos com propósito — cada gesto tem função',
ARRAY['gestualidade', 'presença', 'cênica'],
'{"cicero": "De Oratore I.115"}'),

('85a21691-a352-4b52-a3ba-1216faefe793', 1, 'Adaptação Vocal a Contextos e Meios',
'# Adaptação Vocal a Contextos e Meios

## Cada contexto exige uma voz

- Reunião: clareza e controle
- Apresentação: projeção e energia
- Negociação: intimidade e persuasão
- Debate: firmeza e resposta rápida

## A técnica

1. Observe o ambiente
2. Ajuste a projeção
3. Monitore a recepção
4. Corrija em tempo real',
ARRAY['adaptação', 'contexto', 'voz'],
'{"quintiliano": "Inst. Orat. II"}'),

('7fb64976-d532-4445-ba07-fb09754b068d', 1, 'Simulação Integrada de Pronuntiatio',
'# Simulação Integrada de Pronuntiatio

## O teste final

Tudo converge aqui: pensamento, estrutura, forma, voz, presença.

## A simulação

Você tem 3 minutos para apresentar um argumento complexo a uma audiência hostil. Restrições: tempo limitado, objeções antecipadas, pressão emocional.

## Critérios de sucesso

1. Clareza absoluta (estrutura)
2. Força argumentativa (inventio)
3. Presença física (pronuntiatio)
4. Adaptação à audiência (elocutio)',
ARRAY['simulação', 'pronuntiatio', 'integração'],
'{"cicero": "De Oratore I.115"}');

-- Exercises for Integracao
INSERT INTO liceu_exercises (lesson_id, exercise_type, title, prompt_markdown, expected_answer, is_published) VALUES
('7fb64976-d532-4445-ba07-fb09754b068d',
'case_analysis',
'Simulação integrada de pronuntiatio',
'Apresente um argumento complexo em 3 minutos. Grave-se. Avalie: estrutura, clareza, presença.',
jsonb_build_object('answer', 'Use o padrão clássico: exordium (30s), narratio (30s), partitio (15s), confirmatio (90s), peroratio (15s).'),
true);
