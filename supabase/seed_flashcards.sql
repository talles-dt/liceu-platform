-- Seed: Additional Flashcards for all lessons
INSERT INTO liceu_flashcards (id, lesson_id, front, back, rhetorical_dimension, archetype_key, is_published) VALUES
-- Inventio flashcards
('fc-002-0001', '245cd90f-efdc-48eb-930f-b0a192a6bd48',
'Qual a pergunta que abre a invenção de argumentos?',
'"O que importa aqui?" — esta pergunta direciona toda a busca de argumentos.',
'inventio', 'diagnóstico', true),

('fc-002-0002', 'd8aa0fb3-4393-4d3d-b00d-b9764e148905',
'Quantos status causae existem e quais?',
'Sete: definição, comparação, causa, consequência, autoridade, motivo, exemplo.',
'inventio', 'argumentação', true),

('fc-002-0003', '091d28a7-fb31-414e-9fd6-a41c3cd404cd',
'Qual a diferença entre verdade e verossimilhança?',
'Verdade é fato. Verossimilhança é convencimento. O orador trabalha com verossimilhança.',
'inventio', 'persuasão', true),

-- Dispositio flashcards
('fc-003-0001', 'cb82f35a-053f-4b04-9773-77980fe199ff',
'Quais são as seis partes do discurso clássico?',
'Exordium, narratio, partitio, confirmatio, refutatio, peroratio.',
'dispositio', 'estrutura', true),

('fc-003-0002', '758e13ad-8d77-4756-bc9a-106b3e80298e',
'Qual a ordem dos argumentos no discurso?',
'Ordem = poder. Primeiro argumento é mais memorável, último é mais influente.',
'dispositio', 'ordem', true),

-- Elocutio flashcards
('fc-004-0001', '79302a02-7df5-4e88-af91-1225703bef0c',
'Quais as três virtudes do estilo?',
'Propriedade (palavra certa), clareza (entendível), força (impacto).',
'elocutio', 'estilo', true),

('fc-004-0002', '2784ec24-3250-4cf1-99cc-47b0094f77f9', '2784ec24-3250-4cf1-99cc-47b0094f77f9',
'O que é antítese?',
'Contraste entre ideias opostas para iluminar o conceito.',
'elocutio', 'figura', true),

-- Memoria flashcards
('fc-005-0001', '71df4c99-c24f-4d8b-91c4-407411865812',
'Como funciona a memória retórica?',
'Não decorar — associar argumentos a locais visuais (palácio da memória).',
'memoria', 'retenção', true),

('fc-005-0002', '1b6e97c2-2530-4cf5-b545-cf487f74de42',
'Qual a diferença entre preparo e improviso?',
'Preparo = estrutura memorizada. Improviso = aplicação adaptada sob pressão.',
'memoria', 'improviso', true),

-- Integracao flashcards
('fc-006-0001', 'fd5ec4ff-ef0f-4d96-97cd-e18a6d49f6bb',
'Como as três artes da fala se integram?',
'Inventio (o que dizer) + Dispositio (como organizar) + Elocutio (como dizer) = gesto completo.',
'pronuntiatio', 'integração', true),

('fc-006-0002', '59e98164-c5e7-45f7-a714-4178e9ea899f',
'Qual a base física da fala?',
'A respiração diafragmática sustenta a voz. Voz sem ar não comunica.',
'pronuntiatio', 'voz', true);
