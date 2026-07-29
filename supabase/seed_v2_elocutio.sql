-- Seed: Elocutio content (lessons 24-30)
INSERT INTO liceu_theoretical_content (lesson_id, section_order, title, content_markdown, key_concepts, rhetorical_references) VALUES
('79302a02-7df5-4e88-af91-1225703bef0c', 1, 'Estilo Não é Decoração',
'# Estilo Não é Decoração

## O estilo como função, não forma

Estilo não é "como você escreve". É "o que sua escrita faz". Um estilo bonito sem função é como um vestido caro em uma fogueira — inútil.

## As três virtudes do estilo

1. **Propriedade** (proprietas) — a palavra certa para o conceito
2. **Clareza** (perspicuitas) — o interlocutor entende
3. **Força** (vis) — a palavra tem impacto

## A regra de ouro

Se uma palavra pode ser substituída por outra sem perder significado, ela não estava fazendo seu trabalho.',
ARRAY['estilo', 'propriedade', 'clareza', 'força'],
'{"cicero": "De Oratore I.115", "quintiliano": "Inst. Orat. II"}'),

('9ccd4ea8-bd11-4d28-ba04-9502481f922a', 1, 'Clareza, Concisão e Densidade',
'# Clareza, Concisão e Densidade

## A tríade do estilo eficaz

### Clareza
O leitor entende na primeira leitura.

### Concisão
Nada é redundante. Cada palavra tem propósito.

### Densidade
Cada frase carrega o máximo de significado possível.

## A técnica

1. Escreva a frase completa
2. Corte pela metade
3. Pergunte: "o que sobra é essencial?"',
ARRAY['clareza', 'concisão', 'densidade'],
'{"quintiliano": "Inst. Orat. II.12"}'),

('540f0fee-6285-419d-988e-2906d2c90ab3', 1, 'Escolha Vocabular e Posicionamento',
'# Escolha Vocabular e Posicionamento

## A posição da palavra

Onde você coloca uma palavra determina seu impacto. A mesma ideia dita no início ou no fim da frase tem efeitos diferentes.

## A técnica da posição

1. **Início** — estabelece o tom
2. **Meio** — desenvolve o argumento
3. **Fim** — fixa a memória',
ARRAY['vocabulário', 'posicionamento', 'impacto'],
'{"cicero": "De Oratore I.115"}'),

('7840ec24-3250-4cf1-99cc-47b0094f77f9', 1, 'Figuras Retóricas como Instrumentos Mentais',
'# Figuras Retóricas como Instrumentos Mentais

## Não são decoração

Metáfora, antítese, paralelismo — não são "efeitos". São ferramentas para organizar a mente do interlocutor.

## As principais figuras

- **Paralelismo** — estrutura que memoriza
- **Antítese** — contraste que ilumina
- **Metáfora** — conexão que explica
- **Anáfora** — repetição que fixa',
ARRAY['figuras', 'metáfora', 'antítese', 'paralelismo'],
'{"cicero": "De Oratore I.115", "quintiliano": "Inst. Orat. II"}'),

('0e50454a-6a41-4e36-9288-df04c4221069', 1, 'Vícios Contemporâneos da Linguagem Profissional',
'# Vícios Contemporâneos da Linguagem Profissional

## Os vícios que corroem a comunicação

### 1. Jargão técnico excessivo
Esconder a falta de clareza atrás de termos complexos.

### 2. Vagueza estratégica
"Vamos alinhar" em vez de "vamos decidir".

### 3. Hedging excessivo
"Talvez possamos considerar" em vez de "vou fazer".

### 4. Dupla negação
"Não é que eu não concorde" em vez de "concordo".

## O antídoto

Substituir cada vice por sua virtude oposta. Clareza por jargão. Diretividade por hedging.',
ARRAY['vícios', 'jargão', 'vagueza', 'clareza'],
'{"quintiliano": "Inst. Orat. II"}'),

('ab413826-bbbc-47b5-8289-8d51b49a598f', 1, 'Cortar, Depurar, Fortalecer',
'# Cortar, Depurar, Fortalecer

## O processo de refinamento

1. **Cortar** — remover o que não é essencial
2. **Depurar** — corrigir imprecisões
3. **Fortalecer** — reforçar o que resta

## A disciplina do corte

Cortar não é perder conteúdo. É revelar a estrutura.',
ARRAY['corte', 'depuração', 'fortalecimento'],
'{"quintiliano": "Inst. Orat. II.12"}'),

('5fdb715e-79ad-4c7c-a993-6664848b231c', 1, 'Escrita e Fala como Treino Conjunto',
'# Escrita e Fala como Treino Conjunto

## Por que escrever ajuda a falar

Escrever força a estrutura. Falar testa a clareza.

## A técnica

1. Escreva o discurso
2. Leia em voz alta
3. Ajuste o que soa pesado
4. Repita até fluir naturalmente',
ARRAY['escrita', 'fala', 'treino'],
'{"cicero": "De Oratore I.115"}');

-- Exercises for Elocutio
INSERT INTO liceu_exercises (lesson_id, exercise_type, title, prompt_markdown, expected_answer, is_published) VALUES
('79302a02-7df5-4e88-af91-1225703bef0c',
'error_correction',
'Corrija o texto com vícios de estilo',
'Corrija este texto: "O nosso software é muito bom e tem muitas funcionalidades legais e interessantes que vão resolver todos os seus problemas."',
jsonb_build_object('answer', 'Reescreva: "Este software resolve 87% dos problemas de foco relatados. Três funcionalidades principais: detecção automática, priorização inteligente, integração contínua."'),
true);
