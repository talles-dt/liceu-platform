-- Seed: Simulations (High Cognitive Load Scenarios)
INSERT INTO liceu_simulations (id, lesson_id, title, scenario, constraints, success_criteria, is_published) VALUES
('sim-001', '7fb64976-d532-4445-ba07-fb09754b068d',
'Apresentação sob pressão',
'Você tem 5 minutos para apresentar um projeto urgente ao diretor que sempre desconfia de propostas. Ele já interrompeu duas apresentações hoje.',
'Tempo: 5 minutos. Audiência: crítica e antecipada. Objetivo: convencê-la a liberar orçamento.',
'Resposta bem-sucedida: argumenta com clareza (3 pontos), usa dados concretos, trata objeções com verossimilhança, finaliza com call-to-action específico.',
true),

('sim-002', '7fb64976-d532-4445-ba07-fb09754b068d',
'Resposta a objeção em público',
'Em uma reunião de 20 pessoas, um colega questiona sua metodologia: "Isso parece muito teórico, não é?"',
'Tempo: 30 segundos para responder. Audiência: colegiados. Objetivo: desarmar sem atacar.',
'Resposta bem-sucedida: reconhece a preocupação (ethos), conecta à prática (exemplo), redireciona (call-to-action).',
true),

('sim-003', '7fb64976-d532-4445-ba07-fb09754b068d',
'Defesa de posição impopular',
'Você precisa defender a ideia de cortar um recurso popular porque é ineficiente.',
'Tempo: 2 minutos. Restrição: não pode usar dados (não tem acesso). Objetivo: convencer sem autoridade externa.',
'Resposta bem-sucedida: usa valores compartilhados (ethos), apela para consequências (pathos), oferece alternativa (logos).',
true),

('sim-004', '7fb64976-d532-4445-ba07-fb09754b068d',
'Discurso sem preparo',
'Você é chamado para substituir um palestrante que não pôde comparecer. Tem 10 minutos de preparo.',
'Tempo: 10 minutos de preparo + 15 minutos de discurso. Restrição: não conhece a audiência. Objetivo: entregar valor.',
'Resposta bem-sucedida: usa estrutura clássica, foca em 3 pontos universais, adapta linguagem ao contexto.',
true);
