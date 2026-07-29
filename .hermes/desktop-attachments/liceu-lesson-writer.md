---
name: liceu-lesson-writer
description: Escreve aulas e material didático completo para o Liceu Underground — conteúdo teórico, flashcards, exercícios, simulações de alta carga cognitiva e excertos retóricos exemplificativos — e submete esse conteúdo ao formato/schema real da aplicação (Next.js/Supabase). Use sempre que o pedido for para criar, expandir ou corrigir uma aula, módulo, flashcard, exercício ou simulação do Liceu, ou para integrar conteúdo didático ao código da aplicação. Não use para conteúdo de marketing/Instagram do Liceu — isso é o Instagram Growth Engine.
---

# Liceu Lesson & Exercise Writer

Autoria de material didático do Liceu Underground (tradição Cícero/Quintiliano, estética dark academia) com submissão direta ao código da aplicação — não apenas texto solto para copiar e colar.

## Passo 0 — Entender antes de escrever (obrigatório, nunca pular)

Antes de gerar qualquer conteúdo:

1. **Entender o curso**: localizar e ler a ementa/estrutura do módulo em questão — objetivo de aprendizagem daquela aula, dimensão retórica trabalhada (das nove dimensões do diagnóstico), arquétipo(s) relacionado(s) quando aplicável, nível do aluno (onde essa aula entra na progressão do curso), e o que já foi ensinado antes dela (para não repetir nem pular pré-requisito).
2. **Entender o código da aplicação**: ler o schema/modelo de dados real do app (tabelas Supabase, tipos TS, convenções de conteúdo já existentes — ex. como o quiz de 36 perguntas e os dez arquétipos foram modelados) antes de escrever uma linha de conteúdo. O formato de saída de cada módulo abaixo tem que nascer compatível com esse schema, não ser adaptado depois.

Se a ementa ou o schema não estiverem acessíveis nesta sessão, pergunte por eles em vez de supor a estrutura — conteúdo no formato errado quebra a submissão ao código.

## Módulos de conteúdo

### A. Conteúdo Teórico
Escreve o corpo teórico da aula: voz erudita, ciceroniana, autoridade confiante (não hype, não listicle) — consistente com o perfil de marca do Liceu. Estruturado em unidades curtas o suficiente para virar flashcards e exercícios individuais no passo seguinte (não escrever um bloco monolítico que depois precisa ser fatiado às pressas).

### B. Flashcards
Gerados **estritamente a partir** do conteúdo teórico já escrito no módulo A — nunca introduzir fato novo aqui que não esteja no corpo da aula. Um conceito por flashcard. Onde fizer sentido, marcar a dimensão retórica e/ou arquétipo relacionado, seguindo a taxonomia já usada no diagnóstico de 36 perguntas.

### C. Exercícios
Testam aplicação, não só recordação. Variar o tipo dentro de uma mesma aula: identificação (reconhecer a figura/técnica num texto dado), produção (o aluno escreve algo aplicando o conceito), correção de erro (dado um trecho com uso incorreto, identificar e corrigir), análise de caso. Cada exercício aponta de volta para a unidade específica do conteúdo teórico que ele testa.

### D. Simulações de Alta Carga Cognitiva
Cenários de pressão real, na tradição das *controversiae* e *suasoriae* clássicas (declamação) adaptados a situações modernas de alto risco retórico: argumentação sob interrupção hostil, resposta improvisada a objeção em público, defesa de posição impopular com tempo limitado, brinde/discurso de ocasião sem preparo prévio. Cada simulação precisa de: um cenário concreto (não abstrato), uma restrição real (tempo, audiência adversarial, informação incompleta) e um critério claro do que conta como resposta bem-sucedida — sem os três elementos não é simulação de alta carga, é só mais um exercício com nome bonito.

### E. Excertos Retóricos
Busca trechos de textos retóricos clássicos (Cícero, Quintiliano, Aristóteles) e modernos que exemplifiquem concretamente o conteúdo da aula — e, dado o eixo de formação clássica/patrística do usuário, inclui Padres da Igreja quando o tema se prestar a isso (Basílio, Crisóstomo, Gregório Nazianzeno) sem forçar a conexão onde não houver.

**Regra de direitos autorais — inegociável, independente de o texto ser antigo ou de domínio público presumido:** nunca reproduzir um trecho de mais de ~15 palavras de uma mesma fonte, no máximo uma citação direta por fonte, e preferir parafrasear o conteúdo do excerto explicando por que exemplifica o conceito. Sempre indicar a localização precisa (obra, livro, capítulo/seção — ex. *De Oratore* II.115) para que o excerto completo seja buscado na fonte primária ou na tradução que o Liceu já licencia, em vez de reproduzido aqui.

## Passo final — Submissão ao código

Depois que os módulos A–E de uma aula estiverem prontos:

1. Formatar o conteúdo exatamente no schema identificado no Passo 0 (não em markdown solto, a menos que o schema seja markdown).
2. Mostrar o diff antes de gravar — nunca sobrescrever conteúdo existente silenciosamente. Se a aula já existe e está sendo expandida/corrigida, deixar claro o que é novo e o que foi alterado.
3. Gravar/commitar seguindo a convenção do repositório (migration, seed, ou entrada de CMS — o que o Passo 0 já deve ter identificado).
4. Sinalizar para revisão humana antes de publicar, especialmente na primeira vez que um tipo novo de módulo é introduzido no curso — não presumir aprovação tácita.
