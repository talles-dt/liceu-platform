# Formação pelo Trivium — auditoria e roadmap do piloto

> Estado de execução reconciliado em 27/10/2026: [STATUS.md](docs/implementation/STATUS.md). Este documento preserva requisitos e checkpoints históricos; suas pendências antigas não substituem o registro atual.
**Status:** proposta para revisão pedagógica e técnica; nenhuma feature, migração ou cobrança implementada por este documento.
**Data da auditoria:** 9 de outubro de 2026. **Revisão e consolidação:** 10 de outubro de 2026.

**Plano coordenador:** [LICEU_ROADMAP.md](LICEU_ROADMAP.md). Este documento detalha a formação; a ordem global, os 34 achados e o programa R0–R8 estão no plano coordenador. Em caso de divergência de execução, seguir a fila unificada U00–U11; a especificação pedagógica da formação permanece aqui.
**Repositório auditado:** [talles-dt/liceu-platform](https://github.com/talles-dt/liceu-platform), branch padrão `main`, commit `6969ac8a86ad2a970811f81bd3fce10d280c18fe`.
**Decisão central:** incorporar uma formação com coortes, encontros e portfólios ao mesmo aplicativo. Preservar a identidade do Liceu; não converter a formação em uma sequência de módulos desbloqueados por quiz.

## 1. Mandato e limites da evidência

O piloto autorizado para planejamento tem **6 participantes, R$500 por mês, duração inicial de 6 meses**. Seu movimento recorrente é **leitura → seminário → imitatio → composição → disputatio → declamatio → reflexão**. A formação é de longo prazo; o piloto testa seus primeiros seis meses, sem prometer que eles esgotam a formação. **Gramática, lógica e retórica são os três pilares obrigatórios e integrados.** O ciclo é o modo de trabalho dos três, não um currículo exclusivamente retórico. “Formação pelo Trivium” é nome de trabalho; nome público continua sujeito à revisão.

A auditoria foi feita em clone novo do GitHub, sem modificar a cópia de trabalho da auditoria anterior. A localização na raiz acompanha `DESIGN.md` e `SUPABASE_SETUP.md`; não havia diretório `docs/` versionado no commit examinado. Foram inspecionados código, dependências declaradas, rotas, migrações, seeds, componentes e testes existentes. Não foram executados seeds nem acessados registros pessoais.

Há três estados que Hermes deve distinguir:

| Estado | Evidência | Conclusão permitida |
|---|---|---|
| GitHub atual | Commit acima, conferido em clone novo em 09/10 | Base desta auditoria e dos caminhos citados |
| Banco observado anteriormente | Dump local `audit-evidence/live-schema.sql`, coletado em 08/10 na auditoria anterior; estrutura relida nesta auditoria | Evidência histórica de schema e políticas; **não confirma produção em 09/10** |
| Correções locais anteriores | Cópia `audit-liceu-platform-2026-10-08`, com alterações não commitadas, baseline e migração `20261008231646_subscription_learning_security.sql` | Candidatas a reaproveitamento após revisão; não estão em `main`, nem há aqui comprovação de deploy |

Os dois últimos artefatos são externos a este clone e não são pré-requisitos ocultos para compreender o roadmap. As diferenças relevantes estão descritas abaixo. Hermes deverá obter uma nova inspeção somente de leitura de schema, grants, funções, policies, buckets e histórico de migrações antes de qualquer DDL. Não reproduzir migrações históricas cegamente. Este trabalho documental não afirma build aprovado, segurança validada em produção ou validação pedagógica.

## 2. Auditoria do estado atual

Os caminhos desta seção existem no commit auditado. A expressão “snapshot” identifica exclusivamente o dump de 08/10.

| Área | Estado observado e evidência | Consequência para a formação |
|---|---|---|
| Aplicativo | `package.json`: Next.js `^16.2.4`, React `19.2.3`, TypeScript, Tailwind 4, Supabase SSR `^0.5.1`/JS `^2.49.1`, Stripe, Resend, Sentry, OpenAI e Zernio. App Router em `app/`; `src/lib/` também existe | Continuar no monólito Next.js. Não acrescentar serviço, LMS ou framework para seis pessoas. Versões são declaradas, não prova de ambiente implantado |
| Configuração | `next.config.mjs` e `next.config.ts` coexistem; `middleware.ts` só injeta `x-pathname` para `/admin` | Resolver configuração e renovação de sessão como preparação; middleware não é autorização de dados |
| Identidade | `lib/supabaseServer.ts:getCurrentUser` usa `auth.getSession()`; `lib/users.ts` sincroniza `public.users` com opção `autoAdmin`; `lib/admin/auth.ts` combina banco, metadata e `ADMIN_EMAILS` | Antes de dados do piloto: identidade verificada no servidor e papéis protegidos no banco. Não copiar os atalhos de administração |
| Perfis | `lib/database.types.ts` descreve `users.role` como admin/student; código administrativo usa `users`. Snapshot também contém `profiles`, com FKs legadas, inclusive compras | Reusar `users.id` vinculado a `auth.users`, reconciliar cobertura/roles. Professor e avaliador devem ser papéis da coorte, sem exigir admin global. Não criar terceiro cadastro de pessoas |
| Dois currículos | `lib/domain.ts`, `lib/access.ts`: courses/modules/lessons/module_progress. `app/modules/[moduleId]/page.tsx` e `lib/progression.ts`: `liceu_modules`, `liceu_lessons`, `liceu_learner_progression` | Criar domínio `formation_*` separado; não reutilizar UUID de módulo como ciclo. Mapear leituras úteis sem herdar progressão |
| Progressão | `lib/domain.ts` exige quiz ≥70 e assignment aprovado; `lib/progression.ts` libera módulos posteriores a partir de alguma lição concluída entre módulos anteriores; primeira posição tem regra própria | Regras divergentes e inadequadas ao piloto. Formação usa presença, produção, revisão e juízo docente, nunca desbloqueio por nota ou streak |
| Schema/migrações | `supabase/migrations/20260729_liceu_curriculum_seed.sql` insere em `liceu_*`, mas migrações versionadas não constituem baseline completo dessas tabelas. Snapshot contém as duas famílias, `users` e `profiles` | Reconciliar schema real, histórico e tipos antes da primeira migração aditiva. `database.types.ts` e `lib/database.types.ts` coexistem; cliente servidor usa `SafeClient<any>` |
| Conteúdos | Seeds SQL/Python em `supabase/`; `seed_curriculum.py` depende de DOCX em caminhos locais e UUIDs fixos. `content/blog/` já guarda Markdown no Git | Reusar prática de conteúdo no Git, criar contratos estruturados validados. Não executar scripts de seed existentes para importar a formação |
| Edição | `app/admin/content/page.tsx` lê `liceu_*`; APIs `app/api/admin/content/texts`, `assignments`, `lessons/[moduleId]` fazem upsert/update em tabelas legadas | Editor atual não fornece releases curriculares imutáveis. Separar publicação da formação; não redirecionar editor atual sem migração explícita |
| Exercícios/simulações | Snapshot: `liceu_exercises`, `liceu_simulations`, `liceu_rhetorical_excerpts` contêm conteúdo e critérios. Simulações têm tipos restritos a cenários como interrupção hostil e comunicação de crise | Bom acervo de referência, mas sem instância de encontro, distribuição de papéis ou avaliação entre participantes. Não fingir que uma disputatio já está modelada |
| Produções | APIs de `assignment`, `analysis`, `speech` em `app/api/modules/[moduleId]/` gravam `assignment_submissions`; análise serializa JSON em texto; micro_speech também é texto | Reaproveitar ideias de editor/anotação, não o contrato: faltam revisões explícitas, coautoria, performances compartilhadas, rubricas versionadas e peer review |
| Feedback | `app/api/admin/assignments/[submissionId]/route.ts` atualiza status e `reviewer_notes`, envia email e consulta `modules` | Feedback atual é um parecer mutável, não avaliação vinculada à revisão e à rubrica. Evitar email automático de conteúdo privado |
| Permissões | `20260805_rls_quiz_tables.sql` usa `FOR ALL` para autenticados. Snapshot tem policy de UPDATE próprio em `users` sem proteção de coluna nessa policy, permissões amplas e leitura pública de conteúdo publicado | Achados de segurança a reconciliar, não modelo a copiar. Validar privilégios de coluna, triggers e acesso direto antes de alegar exploração ou correção. Coorte exige isolamento em todas as entidades |
| Storage | `SUPABASE_SETUP.md` manda criar `assignment-files` público; API de assignment usa `getPublicUrl`; `cleanup-files` tenta remover arquivos com mais de 90 dias | Incompatível com portfólio privado de seis meses. Bucket novo privado e retenção própria. Rotina existente lista apenas nível inicial: comportamento real de exclusão não foi validado |
| Calendário | Rotas de mentoria e webhook Cal existem. `app/api/webhooks/cal/route.ts` exige configuração de secret, mas não verifica assinatura do corpo; escreve `mentoring_bookings`, enquanto snapshot contém `mentorship_bookings` | Não reutilizar como calendário da coorte. Agenda interna por atividade e exportação de evento; integração externa pode esperar |
| Componentes | `ReadingLayout`, `WritingArea`, `MinimalButton`, tokens em `app/globals.css`, tabelas administrativas | Reusar apresentação e acessibilidade após revisão. `WritingArea` é apenas textarea; não pressupor autosave. `DashboardShell` aponta “Registros” para `/admin/progress`: corrigir navegação por papel ao integrar |
| Cobrança | `app/api/stripe/checkout/route.ts` usa `mode: "payment"`; `lib/access.ts` infere ebook/video/mentoring de compras e progresso | Não existe ali contrato de mensalidade da formação. Matrícula na coorte deve ser independente de módulo e cobrança; piloto pode ter conciliação manual |
| Dados pessoais | `app/api/me/export-data` e `delete-account` operam principalmente tabelas legadas, incluindo `flashcard_reviews`, ausente do snapshot examinado | Estender exportação, retenção e exclusão para novo domínio; não confiar no endpoint atual como cobertura completa |
| Qualidade | Quatro arquivos de testes de API com mocks (auth/logout, onboarding/status, email/diagnostico, stripe/webhook). `.github/workflows/ci.yml` filtra `master`, mas branch padrão é `main` | Corrigir CI antes da implementação; adicionar teste real de RLS e percurso do aluno. Testes mockados não provam isolamento de dados |

**Não encontrados no código versionado:** entidades de formação/coorte, currículo congelado por turma, Codex persistente, rubricas versionadas por evidência, distribuição de papéis em encontro, banca final ou calendário coletivo próprio. O nome “retórica” em conteúdo existente não supre essas lacunas.

### 2.1 O que reaproveitar, adaptar e manter separado

- **Reaproveitar:** login após correções, identidade `users`, linguagem visual, layouts de leitura, sanitização de Markdown após revisão, infraestrutura de email e observabilidade sem dados pedagógicos nos logs.
- **Adaptar:** menu do dashboard, exportação de dados, proteção de rotas, CI, geração de tipos e padrões de editor com salvamento confirmado. Aproveitar correções locais somente em PRs separados, com evidência atual.
- **Separar:** matrícula, currículo publicado, ciclos, atividades, evidências, rubricas, calendário e Codex da formação. Nenhuma dependência de `canAccessModule`, `markLiceuLessonComplete`, quiz 70%, compra de ebook ou `module_progress`.
- **Não migrar automaticamente:** trabalhos e simulações antigos; uma incorporação futura exige origem, edição e revisão humana explícitas.

## 3. Princípios pedagógicos e escopo

1. **A pedagogia governa o software.** O encontro e o trabalho intelectual continuam possíveis quando o sistema está indisponível. O sistema prepara, preserva evidências e ajuda a devolver feedback.
2. A unidade é o ciclo recorrente e suas questões, não uma prateleira de vídeos. Leitura, escuta, argumentação, composição, pronunciação e reflexão retornam com dificuldade crescente.
3. Participação e entrega não equivalem a domínio; ausência não equivale a incapacidade. Registrar “não observado” sem convertê-lo em nota zero.
4. Professor decide ajustes, retomadas e sínteses; aluno pode revisar. A ferramenta não emite certificação automática de competência ou personalidade.
5. A palavra envolve verdade, responsabilidade, escuta e tratamento justo da objeção. Avaliação de discordância é sobre o argumento, não adesão ideológica.
6. O Codex é caderno de elaboração e repertório. Não fiscalizar sua intimidade, quantidade de notas ou frequência de acesso.
7. Sem rankings, badges, XP, streaks, barras de “maturidade” ou comparação pública de notas. Memória pode ser exercitada por evocação, recitação e retomada de lugares-comuns, sem pontuação de hábito.
8. A condição comercial é **coorte piloto/fundadora**, não preço permanente do Liceu. Receita bruta potencial: R$3.000/mês, R$18.000 em seis meses com seis pagantes; não é lucro nem receita garantida.

**Incluído:** convite/matrícula, página da coorte, seis ciclos, agenda, biblioteca, preparação e papéis, textos e anexos, registro oral, feedback docente e de pares, autoavaliação, Codex privado, baseline, revisões, banca final, exportação do portfólio e relatório do piloto.

**Operação enxuta:** um professor responsável; convidados avaliadores apenas quando necessários; encontros em ferramenta externa já escolhida pelo docente; datas lançadas manualmente; upload de gravação existente e alternativa de registro escrito. Não desenvolver videoconferência, gravação no navegador, transcrição automática ou agenda bidirecional no piloto.

### 3.1 Desenho de seis meses — hipótese a revisar

A distribuição abaixo é proposta, não currículo já aprovado. Cada mês contém o movimento completo, com atividades que podem compartilhar um encontro sem perder identidade. Proposta de carga: três encontros de 90 minutos por mês, mais 2–3 horas semanais de leitura/escrita; confirmar viabilidade antes dos convites. Reservar tempo adicional do professor para preparar e devolver seis trabalhos; medir esse tempo desde o ciclo 1.

| Ciclo | Questão formativa | Exercícios e evidência central |
|---|---|---|
| C1 — Ler e escutar | O que o texto realmente afirma? | Baseline antes das intervenções; paráfrase, narrativa, citação contextualizada; primeira composição e declamatio |
| C2 — Imitar com discernimento | Como uma forma produz efeito? | Imitação declarada, comparação de versões, etopeia; distinguir apropriação de cópia sem atribuição |
| C3 — Argumentar e objetar | O que torna uma razão defensável? | Confirmação/refutação, tese e primeira síntese intermediária do portfólio |
| C4 — Compor e julgar | Como ordenar razões para este público? | Disposição, revisão de composição, controversia/suasoria adaptada; justificativa das escolhas |
| C5 — Pronunciar e responder | Como sustentar a palavra diante do outro? | Declamatio com objeções, memória/evocação, revisão após escuta; atenção à audiência |
| C6 — Integrar e refletir | O que mudou e o que ainda exige trabalho? | Composição final, disputatio, banca, autoavaliação comparativa e symposium de síntese |

Cadência ilustrativa dentro de cada ciclo: leitura e notas antes do encontro 1 (seminário); imitatio e composição entre 1 e 2; encontro 2 para disputatio; revisão e encontro 3 para declamatio e reflexão. Symposium pode ocupar parte ampliada dos encontros de fechamento dos ciclos 3 e 6, com tempo aprovado pelo docente. Recuperação de ausência é acordada e registrada, não bloqueio automático do ciclo seguinte.

Bibliografia é trabalho editorial da fase 1: escolher trechos, edições, tradutores e extensão por ciclo. Cícero, Quintiliano, progymnasmata e autores da tradição cristã mencionados na concepção são candidatos, não lista de leituras já fixada. Para cada leitura exigir referência verificável, localização e direito de distribuição; não fabricar página nem hospedar tradução sem autorização. Excertos do acervo atual só entram após revisão de fidelidade, dificuldade e proveniência.

### 3.2 Atividades próprias, não rótulos de “aula ao vivo”

| Tipo | Preparação e papéis | Acontecimento/evidência | Avaliação e reflexão |
|---|---|---|---|
| Leitura | Trecho, perguntas e objetivo; leitor | Anotação, paráfrase, dúvida e referência | Fidelidade e questão aberta; marca “li” é relato, não domínio |
| Seminário | Leitura; expositor, interlocutores, relator; professor media | Questões, passagens debatidas e síntese; participação observada | Qualidade da escuta e interpretação; o que revisei após ouvir os outros |
| Imitatio | Modelo e traço a imitar; autor identifica fonte | Versão original e transformação, com comentário de escolhas | Relação forma/efeito, atribuição e autonomia |
| Composição | Problema, audiência, gênero e restrições | Rascunho → revisão → versão submetida | Parecer referenciado a trechos; justificativa da reescrita |
| Disputatio | Proposição, corpus e preparação em lados; dois defensores + dois objetores + um relator + um observador; professor modera | Abertura, objeções, réplica, síntese; evidências individuais dentro do evento comum | Força das razões, justiça à posição contrária e resposta; cada pessoa explicita concessões e revisão de juízo |
| Declamatio | Ocasião, audiência, tempo e texto; orador, interlocutor, ouvintes | Performance identificável, com gravação opcional ou registro do docente | Clareza, disposição, voz e resposta ao público; nova tentativa quando pertinente |
| Reflexão | Revisitar evidência e pareceres | Texto breve: o que mudei, por quê, próximo experimento | Autoavaliação fundamentada, não questionário de satisfação |
| Symposium | Questão transversal, contribuições previamente distribuídas; apresentadores, interlocutores, relator | Conversação integradora com síntese comum e contribuições pessoais | Transferência entre leituras/ciclos; novas questões, sem transformar síntese em competição |
| Banca final | Dossiê e tarefa paralela ao baseline; candidato, professor, avaliador convidado se houver | Leitura/composição, apresentação e arguição; pareceres individuais e síntese docente | Comparação por dimensão e contexto; limites da evidência e próximo percurso |

Rodar os papéis entre ciclos, preservando histórico. Professor pode acumular moderação e registro. Papéis pertencem a uma atividade, não são cargos permanentes nem privilégios administrativos. Symposium e banca têm múltiplos participantes/avaliadores; não criar seis cópias desconectadas do mesmo evento.

### 3.3 Trivium: três pilares estruturantes

A inclusão de gramática e lógica é requisito do responsável pedagógico, confirmado em 10/10. Esta é uma proposta de operacionalização para o piloto, não uma alegação de que exista um único currículo histórico do Trivium. Os três pilares aparecem desde o primeiro ciclo, com progressão própria e aplicação conjunta; não reservar gramática para uma introdução ou lógica para uma aula de falácias.

| Pilar | Competências propostas para os seis meses | Práticas e evidências | Limite pedagógico |
|---|---|---|---|
| **Gramática** | Ler com precisão; reconhecer relações sintáticas e referenciais; distinguir sentidos e ambiguidades; analisar coesão, gênero e registro; revisar a expressão preservando o sentido | Leitura próxima; segmentação de período; explicitação de referentes; comparação de paráfrases; edição comentada; imitação de construção e comparação entre versões | Não reduzir a correção ortográfica ou usar sotaque/variedade como medida de inteligência. Norma e registro são ensinados em relação à situação. Latim/grego não são pré-requisitos presumidos |
| **Lógica** | Definir termos; distinguir proposição, premissa e conclusão; reconstruir argumentos; distinguir validade de verdade e força de evidência; reconhecer contradição/equivocação; testar inferências, objeções e contraexemplos | Definição e divisão; mapa de argumento; análise de quantificadores/condicionais em linguagem natural; inferências categóricas/proposicionais introdutórias; contraexemplo; comparação de dedução, indução e analogia | Não reduzir a lista de falácias ou fazer de notação formal uma barreira de entrada. A profundidade formal cresce conforme diagnóstico e tempo disponível |
| **Retórica** | Inventar e selecionar razões, dispor, expressar, recordar e pronunciar; adequar-se à audiência; ouvir e responder com responsabilidade | Imitatio, composição, disputatio, declamatio e symposium; defesa de escolhas, revisão e reflexão | Eficácia persuasiva não prova verdade, validade ou responsabilidade; carisma não substitui argumento |

Um mesmo trabalho pode conter três apreciações distintas: texto linguisticamente preciso com inferência frágil; argumento válido expresso de modo ambíguo; fala eficaz com leitura infiel. A rubrica deve tornar essas diferenças visíveis, sem produzir uma média compensatória que esconda uma delas.

### 3.4 Matriz espiral dos seis ciclos

A tabela de C1–C6 da seção 3.1 descreve o percurso comum. Esta matriz é parte obrigatória do mesmo currículo, **sem triplicar a carga horária**. Cada ciclo tem objetivos dos três pilares, pelo menos uma evidência observável por pilar e uma tarefa integradora. Minioficinas de gramática e lógica entram no tempo de leitura/seminário e na preparação, substituindo volume de outras tarefas quando necessário.

| Ciclo | Gramática | Lógica | Retórica / tarefa integradora |
|---|---|---|---|
| C1 | Sintaxe e referentes; paráfrase fiel; ambiguidade lexical | Termos, proposições, premissas/conclusão; distinguir afirmar e justificar | Ler um trecho, reconstruir seu argumento e apresentá-lo oralmente sem distorção; baseline separado da intervenção |
| C2 | Coesão, período, figuras e registro; imitação com comentário | Definição/divisão; identidade dos termos e equivocação | Imitar uma construção e defender como a mudança altera sentido e efeito; glossário contextual no Codex |
| C3 | Negação, quantificadores, condicionais e alcance das expressões | Validade/verdade; formas inferenciais básicas e contraexemplo | Disputatio com reconstrução justa da tese e teste das inferências; síntese intermediária dos três pilares |
| C4 | Coerência entre parágrafos, gênero, ordem informacional e revisão | Dedução, indução, analogia; pertinência e suficiência da evidência | Composição para audiência definida com mapa argumentativo e edição comentada |
| C5 | Registro oral/escrito, pontuação/prosódia e precisão sob objeção | Premissas implícitas, carga da prova e revisão diante de objeções | Declamatio com arguição: responder sem mudar indevidamente os termos ou a tese |
| C6 | Edição final e interpretação de trecho novo | Reconstrução e avaliação independente de argumento novo | Banca e symposium integradores; comparar evidências de cada pilar com baseline e propor continuidade |

Exemplo de percurso completo sobre um texto: **leitura** identifica sintaxe, sentidos e premissas → **seminário** testa interpretações e reconstruções → **imitatio** transforma a forma sem confundir a tese → **composição** articula razões para uma audiência → **disputatio** testa inferências e objeções → **declamatio** torna o discurso inteligível e situado → **reflexão** explica mudanças linguísticas, lógicas e retóricas. Uma evidência pode servir a mais de um pilar, desde que o parecer explicite o critério observado.

Bibliografia deve ter trilhas de gramática, lógica e retórica, com textos primários e apoio adequados ao nível de entrada. Gramática: selecionar referência de língua portuguesa e textos para análise; lógica: selecionar introdução conceitual e trechos primários quando pedagogicamente cabíveis; retórica: selecionar o corpus proposto na seção 3.1. Não presumir que os materiais de Armas da Palavra cubram os outros dois pilares. Edições, traduções, capítulos, direitos e carga serão verificados por item antes de publicação.

O Codex também registra definições contextualizadas, distinções conceituais, mapas de argumentos, contraexemplos, variantes de expressão e notas de revisão, além de citações e lugares-comuns. Esses formatos são opcionais para o caderno privado; a avaliação utiliza somente evidências submetidas ou compartilhadas explicitamente.

## 4. Arquitetura proposta

**Um domínio adicional no aplicativo e banco atuais**, com prefixo `formation_` em tabelas de execução. Manter nomes do conteúdo em inglês técnico e interface em português. As mudanças necessárias ao curso Armas da Palavra seguem U01–U05 do plano coordenador, sem misturar suas regras de progressão com a formação.

```text
Formation ──< CurriculumRelease ──< ContentItem (IDs estáveis + versão)
   │                 │
   └──< Cohort ──────┘  release inicial fixada
          ├──< Membership (users.id; participante/professor/avaliador)
          └──< Cycle ──< Activity ──< Participation (papéis e presença)
                           ├──< Submission ──< SubmissionRevision
                           ├──< Performance ──< PerformanceParticipant
                           └──< Reflection (submissão própria referenciada)
SubmissionRevision / Performance ──< Assessment (rubrica da release)
Cohort + owner ──< CodexEntry (privado, compartilhamento explícito)
```

Separar **definição curricular** (o que foi proposto) de **execução** (quando, com quem, o que aconteceu) e **evidência** (versão do trabalho e parecer). Releases contêm textos/prompts/rubricas; atividades instanciam referências estáveis com cronograma e papéis. Atividade não significa encontro: imitatio pode ser assíncrona; seminário tem horário e presença. Evitar framework genérico de workflows: tipos finitos e estados simples bastam.

Organização futura:

- `content/formations/retorica/`: manifestos, ciclos, bibliografias, rubricas, exercícios, prompts e Markdown sem código executável.
- `lib/formation/{types,schemas,queries,commands,authorization}.ts`: contratos, validação e acesso a dados. Fronteira de servidor nas consultas e comandos; não exportar admin client para cliente.
- `components/formation/`: editor, agenda, papéis, evidências, rubrica e linha do tempo.
- `app/formacoes/` e `app/admin/formacoes/`: percursos do participante e da equipe, com autorização de coorte em cada consulta/mutação; layout não é barreira suficiente.
- `scripts/formation/`: validar pacote, gerar diff e importar release idempotentemente. Não fazer importação curricular no build/deploy da aplicação.
- `supabase/migrations/` e `supabase/tests/`: DDL aditivo e testes de isolamento. Tipos gerados a partir de schema reconciliado.

## 5. Modelo de dados proposto

Contrato lógico para discussão, não SQL pronto para produção. `id` UUID em entidades operacionais; `*_key` textual estável em conteúdo; timestamps com fuso. `users.id` é identidade, nunca email. Tabelas abaixo recebem prefixo `formation_` (por exemplo, `formation_programs` e `formation_cohorts`), exceto `users` existente. Índices nos FKs e filtros de coorte/autor/data. Campos de auditoria (`created_at`, `created_by`, `updated_at` quando mutável) são implícitos.

| Tabela | Campos e relações essenciais | Regra/invariante |
|---|---|---|
| `programs` | id, slug, title, purpose, status | Slug único; não FK obrigatória para courses |
| `curriculum_releases` | id, formation_id, version, schema_version, source_commit, manifest_hash, manifest_json, published_by/at | UNIQUE(formation_id, version); release publicada imutável; hash do pacote completo |
| `content_items` | release_id, item_key, kind, payload_json, content_hash | PK(release_id,item_key); kinds: cycle, activity, reading, rubric, exercise_type, prompt; links internos resolvidos na mesma release |
| `cohorts` | id, formation_id, slug, initial_release_id, starts_on, ends_on, timezone, capacity=6, monthly_fee_cents=50000, currency=BRL, status | Release da mesma formation; capacidade de participantes aplicada transacionalmente, equipe não ocupa vaga |
| `memberships` | id, cohort_id, user_id, role, status, joined_at, ended_at | UNIQUE(cohort_id,user_id,role); participante, professor ou avaliador; inscrição/convite não se autoaprova; estado invited/active/paused/withdrawn/completed |
| `cycles` | id, cohort_id, cycle_key, effective_release_id, starts_on, ends_on, status | UNIQUE(cohort_id,cycle_key); FK para definição da release; abertura/fechamento pelo docente |
| `curriculum_changes` | id, cohort_id, cycle_id, old_release_id, new_release_id, reason, approved_by, effective_at | Histórico append-only; mudança futura explícita, sem relink de evidências anteriores |
| `activities` | id, cohort_id, cycle_id, release_id, activity_key, type, title, status, starts_at/ends_at, due_at, location_or_meeting_url, operational_revision | FK para definição de conteúdo; draft/scheduled/open/held/reflection_open/closed/cancelled com transições por tipo; status held não aprova participante |
| `participations` | id, cohort_id, activity_id, membership_id, role_key, attendance, preparation_status, teacher_note | UNIQUE(activity_id,membership_id,role_key); presença unknown/present/absent/excused; nota docente com visibilidade explícita |
| `submissions` | id, cohort_id, activity_id, author_membership_id, purpose, status, draft_body, lock_version | UNIQUE(activity_id,author_membership_id,purpose); draft/submitted/revision_requested/closed; purpose inclui preparation/composition/reflection; rascunho usa controle de concorrência |
| `submission_revisions` | id, cohort_id, submission_id, revision_no, release_id, prompt_key, body, submitted_at, content_hash, reflects_on_revision_id ou reflects_on_performance_id | UNIQUE(submission_id,revision_no); versões submetidas imutáveis; referências de reflexão opcionais e coerentes com atividade/coorte |
| `performances` | id, cohort_id, activity_id, occurred_at, evidence_status, record_body, supersedes_id | Uma ocorrência, inclusive coletiva; alternativa escrita à gravação; correção por nova ocorrência/registro auditado, sem mudar avaliação já emitida |
| `performance_participants` | performance_id, membership_id, role_key, contribution_locator | Liga cada pessoa à ocorrência; locator pode ser intervalo de tempo ou passagem do registro |
| `artifacts` | id, cohort_id, owner_id, submission_revision_id XOR performance_id, bucket, object_path, mime, bytes, sha256, consent_id, retention_until, state | Arquivo privado; pending/ready/failed/deleted. URL assinada é gerada, não persistida como fonte |
| `review_assignments` | id, cohort_id, reviewer_membership_id, subject_membership_id, submission_revision_id XOR performance_id, kind, due_at, status | Professor atribui pares/banca; UNIQUE do alvo+avaliador+tipo; só evidencia selecionada fica acessível |
| `assessments` | id, cohort_id, review_assignment_id, assessor_id, subject_membership_id, target_revision_id XOR performance_id, kind, release_id, rubric_key, observations_json, narrative, next_step, status, supersedes_id | kind teacher/peer/self/panel; dimensões validadas pela rubrica; draft/published; publicação imutável, retificação vinculada |
| `codex_entries` | id, cohort_id, owner_id, title, body, source_release_id/source_item_key, source_locator, tags, lock_version | Privado por padrão; citação, comentário e elaboração próprios distinguíveis; registro pode não ter fonte |
| `codex_shares` | id, entry_id, recipient_membership_id, shared_snapshot, shared_at, revoked_at | Compartilha snapshot com pessoa nomeada; alterações do caderno não vazam automaticamente; revogação remove acesso futuro |
| `consents` | id, cohort_id, user_id, purpose, policy_version, granted_at, withdrawn_at | Gravação/compartilhamento diferenciados; histórico restrito; recusa oferece alternativa pedagógica |
| `events` | id, cohort_id, actor_id, event_type, entity_type/id, occurred_at, idempotency_key, metadata mínima | UNIQUE(idempotency_key); append-only, servidor escreve; sem texto de trabalhos nem URLs/tokens |

### 5.1 Integridade que não pode ficar apenas no frontend

- Propagar `cohort_id` para alvos sensíveis e usar FKs compostas/validações transacionais: submission, membership, cycle, activity, performance, assessment e artefato devem pertencer à mesma coorte. UUID válido de outra turma não basta.
- Aluno não escolhe `author_id`, `cohort_id`, papel, assessor, estado publicado ou versão curricular livremente; servidor deriva e banco confere. Troca de autor/parent após criação proibida.
- Content refs usam `(release_id,item_key)`; validar kind esperado e referências de competência ao importar e ao instanciar. O catálogo de competências é versionado dentro do manifesto (`competencies.json`, incluído no hash); não requer nova tabela de execução. Uma rubrica não pode ocupar o lugar de prompt.
- Avaliação referencia **uma revisão exata ou uma performance exata**, nunca “última entrega”. Em performance coletiva, `subject_membership_id` deve estar entre os participantes; cada parecer continua individual.
- Professor determina fechamento do ciclo com síntese e retomadas. Não criar percentual global de domínio. Estado operacional e parecer pedagógico são coisas distintas.
- Publicar trabalho, atribuir review e registrar evento em transação; submissão idempotente não duplica revisão. Salvar rascunho com `lock_version`, retornando conflito em vez de sobrescrever outra aba.
- Artifacts são anexados após confirmar upload; falha de metadados cria pendência recuperável. Limpeza remove apenas órfãos comprovados, não evidência válida por idade.
- FKs de evidência não devem apagar silenciosamente portfólios ao excluir ciclo/release. Arquivar execução; exclusão de dados pessoais usa fluxo próprio, auditado, incluindo arquivos e participações coletivas.
- Tabelas de permissão, membership e publicação só podem ser modificadas por comandos autorizados. `service_role` não é atalho para ignorar verificação de identidade, escopo e alvo.

## 6. Currículo e conteúdo versionados — incluindo o Trivium

**Fonte editorial:** Git. **Fonte de execução:** snapshot publicado no banco. Conteúdo nunca é buscado de `main` em tempo de leitura da coorte. Git sozinho não resolve reprodutibilidade se a aplicação lê tabelas mutáveis.

Estrutura prevista (ainda não criada):

```text
content/formations/retorica/
  schema/manifest.schema.json
  schema/activity.schema.json
  releases/0.1.0/
    manifest.json
    cycles/c01.json ... c06.json
    activities/c01-seminario.json ...
    exercise-types.json
    readings/bibliography.json
    competencies.json
    rubrics/grammar.json
    rubrics/logic.json
    rubrics/reading.json
    rubrics/composition.json
    rubrics/oral.json
    rubrics/dialogue.json
    prompts/*.md
```

Manifesto tem `pillars: ["grammar", "logic", "rhetoric"]`, `schema_version`, `formation_key`, `version`, objetivos, ciclo pedagógico, índice de todos os arquivos com hash, autores/revisores editoriais e changelog. Item tem chave estável, título, tipo, `pillars` (um ou mais dos três), `competency_keys` estáveis, objetivos, preparação, restrições, entregas esperadas, prompts, critérios, referências e acessibilidade. Atividade síncrona inclui papéis, cardinalidades, sequência e alternativa em caso de ausência. Bibliografia inclui autor, obra, edição, tradutor, ano, idioma, localização exata, link, direitos, extensão proposta e status de revisão. Markdown é conteúdo sanitizado, sem MDX arbitrário.

Exemplo **ilustrativo**, a ser validado contra o schema futuro:

```json
{
  "key": "c01.disputatio",
  "type": "disputatio",
  "pillars": ["grammar", "logic", "rhetoric"],
  "competency_keys": ["grammar.precision", "logic.objections", "rhetoric.response"],
  "cycle_key": "c01",
  "prompt_key": "prompts.c01.proposicao",
  "rubric_key": "rubrics.dialogue",
  "reading_keys": ["readings.c01.primary"],
  "roles": {"defensor": 2, "objetor": 2, "relator": 1, "observador": 1},
  "stages": ["preparation", "opening", "objections", "reply", "synthesis", "reflection"],
  "evidence": ["preparation_note", "performance_record", "individual_reflection"]
}
```

Fluxo editorial obrigatório:

1. Hermes produz proposta e valida JSON Schema, referências, unicidade, cardinalidade de papéis, carga e cobertura do ciclo completo. Validar os três pilares em cada ciclo por objetivos, atividade/evidência e critério de rubrica, não apenas por tags. IDs estáveis não são gerados a partir do título.
2. Docente revisa currículo, rubricas, trechos/edições, linguagem, esforço e critérios. Código verde não significa publicação pedagógica aprovada.
3. PR de conteúdo registra diff e motivo; publicar uma versão exige aprovação docente registrada, commit de origem e hash do pacote. Importador começa por dry-run, sem escrita.
4. Importar em transação. Mesma versão+hash é no-op; mesma versão com hash distinto é erro. Releases publicadas não recebem UPDATE/DELETE por edição normal.
5. Coorte fixa `initial_release_id`; cada ciclo fixa sua release efetiva. Submissões e pareceres guardam as referências usadas. UI e exportação mostram essas versões.
6. Errata gera nova release. Coorte em andamento só a adota por decisão explícita com motivo/data para ciclos futuros; ciclos iniciados e evidências permanecem intactos. Necessidade de alterar atividade já iniciada gera atividade sucessora identificada e aviso, preservando a anterior.
7. Reagendar encontro altera apenas execução e gera histórico/aviso; alterar prompt, bibliografia exigida ou rubrica é mudança curricular. Não usar campo de “override” livre para contornar versionamento.

Aceite de reprodutibilidade: publicar 0.2.0 não altera a coorte em 0.1.0; uma exportação consegue reconstruir prompt, leitura atribuída, rubrica, autoria editorial e hash usados em qualquer avaliação. Não basta guardar uma string `version` na coorte.

## 7. Permissões, privacidade e armazenamento

Autorização combina identidade verificada, membership vigente, papel e vínculo com o recurso. RLS e grants por operação em tabelas expostas; negar por padrão. Consultas administrativas com privilégio precisam de checagem explícita de escopo. Helpers privilegiados, quando necessários, ficam em schema privado, com `search_path` fixo e execução restrita. Views devem preservar a política de acesso.

| Recurso | Participante | Professor da coorte | Par/avaliador designado | Admin operacional |
|---|---|---|---|---|
| Agenda/conteúdo publicado da coorte | Ler se matriculado | Gerir execução; publicação curricular tem aprovação separada | Apenas atividades atribuídas | Gerir matrícula/configuração |
| Rascunho individual | Ler/escrever próprio | Sem leitura automática | Nenhum | Sem UI de leitura pedagógica indiscriminada |
| Revisão submetida | Própria; selecionada de colega se designado | Ler/devolver parecer | Ler revisão atribuída, não todo portfólio | Acesso excepcional registrado |
| Performance | Própria participação; compartilhada conforme finalidade/consentimento | Registrar e avaliar | Somente ocorrência atribuída | Suporte restrito e auditado |
| Parecer | Ler publicado sobre si; escrever autoavaliação | Escrever/publicar docente | Escrever parecer atribuído; não publicar como docente | Não alterar juízo docente |
| Codex | Somente proprietário e compartilhamentos explícitos | Só snapshot compartilhado | Só snapshot compartilhado | Sem acesso normal; não prometer sigilo contra operador do banco |
| Rubricas/release publicada | Ler versão da coorte | Propor nova versão | Ler versão pertinente | Importar somente release aprovada |

Aluno não pode se matricular como professor nem designar a si como avaliador de outros. Autoavaliação não é peer review. Pares não recebem email ou dados comerciais dos colegas. Professor vê apenas coortes atribuídas. Avaliador convidado recebe membership restrita e prazo; sem admin global.

Usar buckets privados distintos `formation-artifacts` e, se necessário, `formation-readings`. RLS em `storage.objects` vincula objeto a registro autorizado, não somente pasta informada pelo cliente. Caminho proposto: `cohort_id/owner_id/artifact_id/original.ext`. Downloads por URL assinada curta (proposta: 5 min) após autorização; revogação impede novas URLs, mas a já emitida pode durar até expirar. Para leitura, verificar licença além do acesso.

Proposta inicial de limites: texto/PDF/DOCX até 10 MB; áudio até 100 MB, vídeo até 500 MB, com upload direto autorizado e limites confirmados no ambiente antes do piloto. Validar extensão, MIME e conteúdo; não renderizar HTML/anexos ativos inline. Vídeo é opcional; permitir registro docente escrito. Não usar `getPublicUrl` nem copiar a limpeza de 90 dias. Cloudflare Stream atual pode ser avaliado depois, sem obrigação de adotá-lo.

Retenção proposta para revisão: durante os seis meses + 90 dias para fechamento/exportação; depois política explícita de continuidade, exportação e remoção. A escolha deve estar definida antes da coleta; não prometer guarda permanente. Gravação coletiva exige decisão para todos os presentes e alternativa sem gravação. Consentimento de publicação promocional é separado da participação no piloto. Retirada aciona revisão de acesso/arquivo, não destruição silenciosa de evidências de outras pessoas.

Exportação inclui trabalhos/revisões, avaliações publicadas autorizadas, Codex próprio, referências/versionamento e arquivos próprios permitidos. Não incluir rascunhos de terceiros, notas docentes privadas ou todo vídeo coletivo sem autorização. Exclusão deve revogar acesso, tratar sessões, remover objetos e sanear contribuições coletivas segundo política acordada; imutabilidade curricular não impede tratamento de dados pessoais. Revisar política jurídica aplicável antes da operação, sem presumir que este roadmap seja parecer legal.

## 8. UX, rotas e contratos de aplicação

A primeira tela responde: **o que estamos investigando, o que preparar, quando nos encontramos e que devolutiva preciso considerar**. Preservar estética do Liceu com legibilidade, linguagem em português e navegação acessível. Sem transformar pendências em falha moral ou presença em nota.

| Rota proposta | Experiência e autorização |
|---|---|
| `/formacoes` | Formações e coortes acessíveis ao usuário; sem listar participantes de outras turmas |
| `/formacoes/[formationSlug]/[cohortSlug]` | Questão do ciclo, próximo encontro, preparo, minhas entregas e devolutivas |
| `.../ciclos/[cycleId]` | Movimento completo, textos, atividades e síntese; status pedagógico narrativo |
| `.../atividades/[activityId]` | Objetivo, preparação, papéis, agenda/ocorrência, evidência, avaliação e reflexão em seções claras |
| `.../biblioteca` | Leituras por ciclo, edição/localização, obrigatória ou complementar; versão e acesso ao texto |
| `.../calendario` | Agenda simples por data, timezone da coorte e exportação autenticada de eventos ICS |
| `.../codex` | Caderno privado, fonte/trecho/comentário, busca local da coorte e compartilhamento nominal |
| `.../portfolio` | Próprias revisões, performances, baseline, devolutivas e comparação final; exportar |
| `.../revisoes` | Somente evidências para as quais o usuário foi designado par/avaliador |
| `/admin/formacoes/[cohortId]` | Equipe da coorte: seis participantes, agenda, papéis, devolutivas e publicação; acesso docente não equivale a admin global |

Todas as rotas são propostas, não existentes. O atual `app/admin/layout.tsx` é orientado a admin global: antes de usar `/admin/formacoes`, adaptar a fronteira de layouts/guards para permitir equipe de coorte **sem abrir `/admin/users` ou outras páginas**. Se essa separação aumentar risco, preferir `/formacoes/[formationSlug]/[cohortSlug]/docencia`, mantendo só publicação/importação no admin. Fase 2 decide e registra uma única opção; não implementar as duas.

API prevista sob `/api/formations/cohorts/[cohortId]/`: membership, cycles, activities, participation, submissions/draft, submissions/submit, performances, review-assignments, assessments/publish, codex, artifacts/authorize-upload, artifacts/download e export. Route Handlers chamam comandos únicos de domínio; não duplicar regra em Server Action e API. IDs de URL sempre são confrontados com pais e membership. Validação de entrada e limites de tamanho em cada mutação; cookies exigem proteção contra requisições cross-site.

Contratos mínimos: sem login → 401; escopo indevido → 403/404 consistente sem revelar conteúdo; entrada inválida → 400; conflito de rascunho ou estado → 409; excesso de limite → 413/429. Escritas retornam ID/revisão/timestamp persistidos. Erro nunca aparece como “salvo”. A interface distingue “salvando”, “salvo” e “falhou”; recarregar e abrir outra sessão deve mostrar o mesmo trabalho. Rede interrompida mantém texto recuperável, com aviso em dispositivo compartilhado.

Reagendamento preserva ID do evento e incrementa revisão ICS; cancelamento gera estado cancelado, não desaparecimento. Não publicar link de reunião privada em calendário público. Estado vazio explica a próxima ação; turma encerrada mantém histórico próprio conforme retenção. Suspensão comercial não apaga trabalho nem atribui juízo pedagógico negativo.

## 9. Baseline, rubricas e acompanhamento formativo

### 9.1 Baseline e banca

Antes do ciclo 1: tarefas diagnósticas dos três pilares — análise de sentido/sintaxe e revisão de ambiguidade (gramática), reconstrução de argumento e justificação/contraexemplo (lógica), composição e fala com audiência e objeção (retórica) — acompanhadas de entrevista breve de contexto e expectativas. Usar leitura/paráfrase, composição curta e fala de 3–5 minutos seguida de objeção para observar essas competências. Proposta de condições: preparação registrada, tempo de execução definido, adaptações acessíveis anotadas. Guardar instrução, texto/edição, revisão da produção, condições e rubrica. Professor não infere repertório ou capacidade a partir de diagnóstico comercial/arquetípico existente.

Na banca final: tarefa paralela de dificuldade justificada, mesmas dimensões e condições comparáveis, incluindo gramática, lógica e retórica em texto/problema novo; candidato apresenta portfólio e responde a objeções. Registrar diferenças de contexto e mudança de rubrica quando houver. Professor e eventual segundo avaliador fazem pareceres antes da síntese para preservar divergências. Comparar evidências, não só um número de entrada com outro de saída.

### 9.2 Rubrica inicial para elaboração editorial

Quatro descritores comuns: **necessita apoio**, **em desenvolvimento**, **consistente nesta tarefa**, **transfere para nova situação**; opção **não observado** fora da escala. Cada dimensão precisa de descritores próprios e exemplos âncora no pacote curricular antes da publicação. Não calcular média geral nem usar limiar 70%.

| Dimensão | O que observar | Exemplo de âncora “consistente nesta tarefa” |
|---|---|---|
| Leitura e fidelidade | Distingue tese, suporte, contexto e citação | Paráfrase preserva a tese, aponta passagem e reconhece limite interpretativo |
| Gramática: precisão e relações | Sintaxe, referentes, ambiguidade, sentido, coesão e registro | Explicita relações, resolve ambiguidade sem distorcer a tese e justifica revisão em função da situação |
| Lógica: reconstrução | Termos, definições, premissas explícitas/implícitas e conclusão | Reconstrói o argumento fielmente, distingue o que é afirmado do que é inferido e declara pressupostos |
| Lógica: avaliação | Validade/verdade, força da evidência, contraexemplos e objeções | Testa a inferência, distingue validade de verdade e ajusta conclusão ao alcance das razões |
| Retórica: argumentação situada | Seleção de razões, audiência, objeções e responsabilidade | Expõe razões pertinentes, trata a objeção forte com justiça e explica escolhas para a audiência |
| Composição | Ordenação, unidade, transições e público | Sequência de razões sustenta tese para audiência definida; revisão justifica escolhas |
| Expressão oral | Inteligibilidade, ritmo, presença e adequação | Fala compreensível, tempo manejado e resposta pertinente; considerar adaptações individuais |
| Escuta e juízo | Reconstrução justa do outro e discernimento | Reconstrói objeção antes de responder; distingue discordância de incompreensão |
| Repertório/memória | Uso pertinente e contextualizado de referências | Evoca e relaciona fonte sem inventar citação nem substituir argumento por autoridade |
| Reflexão e revisão | Evidência do aprendizado e decisão seguinte | Localiza mudança entre versões e formula próximo experimento realizável |

Peer feedback usa estrutura breve: **uma observação com referência à evidência, uma pergunta, uma sugestão praticável**. Docente atribui pares e modera abuso; pairings rotativos evitam panelinhas. Autoavaliação compara intenção, resultado e parecer recebido. Nota do par não se transforma automaticamente em parecer docente.

Acompanhamento por ciclo: síntese do professor com observações distintas de gramática, lógica e retórica, dimensão trabalhada, evidência escolhida pelo participante, uma retomada e um próximo passo. Proposta de prazo docente: até sete dias após entrega pactuada; medir e revisar se inviável. Dashboard docente mostra pendências de devolutiva e lacunas de observação, não ranking de alunos.

## 10. Instrumentação e decisão sobre o piloto

Registrar eventos operacionais mínimos: membership_activated, activity_scheduled/rescheduled, attendance_recorded, submission_revision_created, performance_recorded, assessment_published, reflection_submitted, release_adopted, export_completed. Não registrar o conteúdo do Codex em analytics, nem usar tempo de página como competência. Logs de erro devem excluir texto de trabalhos, tokens, signed URLs e dados de cobrança.

| Pergunta | Evidência e ritmo | Decisão apoiada |
|---|---|---|
| O desenho cabe na vida dos seis? | Presença com motivo opcional, entregas/retomadas e carga autorrelatada; revisão mensal | Ajustar carga, extensão de leituras e calendário |
| O professor consegue sustentar a proposta? | Horas de preparo/correção/encontro em registro semanal, prazo real de devolutiva | Reduzir volume ou mudar cadência antes de ampliar turma |
| Há desenvolvimento observável nos três pilares? | Baseline + amostra por ciclo + banca; parecer de gramática, lógica e retórica por dimensão com evidências | Identificar avanços, permanências e lacunas sem promessa causal |
| Pares e reflexão ajudam? | Revisões com justificativa que citam feedback; conversa intermediária no C3 | Melhorar instruções de feedback e escolha de pares |
| O software ajuda ou interrompe? | Falhas de salvamento/upload, pedidos de suporte e observação de percurso | Corrigir fricções antes de acrescentar recursos |
| A operação é sustentável? | Recebimentos conciliados, horas e custos reais separados | Rever preço/escopo após o piloto; sem automatizar exclusão por atraso |

Dados qualitativos individuais com acesso restrito; relatório agregado cuidadoso, pois seis pessoas são facilmente reconhecíveis. Amostra de seis não demonstra causalidade nem validação estatística generalizável. Ausência, desistência e “não observado” entram explicitamente; não completar dados faltantes.

Proposta de revisão em C3 e ao final: continuar/adaptar/pausar, com decisão docente e razões. Sinais desejados: cada participante ativo tem baseline e evidência final ou motivo documentado; devolutivas úteis dentro de prazo acordado; nenhum incidente de acesso ou perda não recuperável; custo docente dentro do orçamento de horas aprovado. Resultados pedagógicos insatisfatórios podem recomendar mudança do currículo mesmo com software funcionando.

## 11. Fases, requisitos e aceite

Prioridades: **P0** impede coleta real; **P1** necessário ao percurso do piloto; **P2** adiável. Estimativas de calendário devem ser feitas após fase 0, não presumidas neste documento. O encadeamento abaixo é por dependência.

| Fase | Entrega e requisito | Critério de aceite verificável |
|---|---|---|
| 0 — Base confiável (P0) | Inventário atual de schema/Storage; comparar main com correções locais; reconciliar auth, roles, CI, tipos e configuração em PRs próprios | Identidade adulterada/expirada negada; estudante não promove papel nem lê terceiros; CI executa em main; schema de staging reproduzível; achados remanescentes registrados |
| 1 — Contrato pedagógico (P1) | Manifesto 0.1.0, seis ciclos, bibliografia revisada, tipos/prompts, rubricas completas, baseline/banca, carga, política de dados | Docente aprova; todos os sete movimentos e os três pilares presentes por ciclo; tarefas e critérios alinhados; papéis acomodam seis; fontes/localizações e direitos verificados; carga cabe na cadência |
| 2 — Domínio e release (P0/P1) | Schema aditivo, validação/importação de release, matrícula, memberships, RLS e decisão de rota docente | Importação repetida não duplica; versão alterada com mesmo número rejeitada; coortes isoladas; sétima matrícula concorrente rejeitada; staff não ocupa vaga; rollback ensaiado |
| 3 — Coorte habitável (P1) | Início, ciclo, biblioteca, agenda, atividades/papéis e Codex mínimo | Aluno acha leitura e próximo encontro sem admin; papéis rotacionam; data/fuso corretos; Codex recarrega privado; teclado/mobile utilizáveis |
| 4 — Evidência e devolutiva (P0/P1) | Rascunho/revisão, upload privado, performance coletiva, rubrica, peer/self feedback, reflexão e exportação | Duas abas não perdem texto; falha de rede recuperável; URL pública inexistente; avaliação fixa revisão; par vê só alvo; banca simulada e exportação incluem versões corretas |
| 5 — Ensaio e abertura (P0) | Jornada completa com contas sintéticas, restore/export/delete, primeiro ciclo publicado, matrícula real controlada | Percurso de baseline a banca ensaiado, inclusive ausência/revisão/cancelamento; nenhum bloqueador P0; professor aprova experiência; release, retenção e operação comercial registradas |
| 6 — Operação e revisão (P1) | Seis meses, fechamento mensal, avaliação C3 e C6 | Dossiês rastreáveis, carga/custos conhecidos, decisão de continuidade baseada em evidência, mudanças futuras versionadas |

Fases 1 e preparação técnica podem avançar sem dependência entre si; execução com participantes só após os gates P0. Não é necessário terminar seis meses de texto refinado antes do primeiro encontro, mas a release inicial deve conter a arquitetura completa e C1 pronto; itens ainda não prontos devem estar explicitamente em rascunho, sem serem anunciados como publicados. Para abrir cada ciclo, seu conteúdo integral exige release aprovada. Se a coorte adotar versões posteriores, registrar isso por ciclo; não alegar que cursou integralmente 0.1.0.

### 11.1 Testes de aceite transversais

- **TRI-01:** o validador rejeita ciclo sem objetivo, evidência e critério de qualquer um dos três pilares; uma tag isolada não satisfaz a cobertura. Baseline, C3 e banca apresentam evidências separadas de gramática, lógica e retórica.
- **TRI-02:** tarefa sintética com fala persuasiva e inferência inválida recebe apreciações distintas; nota retórica não mascara problema lógico. Variação linguística não é tratada automaticamente como erro. Professor valida interpretação, sem avaliação automática de competência.
- **AUTH-01:** participante A, B, professor de outra coorte, convidado e anônimo tentam SELECT/INSERT/UPDATE/DELETE direto pela Data API e pelos handlers. Acessos indevidos negados, inclusive Storage e alteração de parents.
- **AUTH-02:** manipular metadata, papel e membership não concede docência; professor da coorte não acessa administração global. Renovação/expiração de sessão tem comportamento verificável.
- **CUR-01:** criar 0.2.0 mantém C1 e seus pareceres em 0.1.0; adoção explícita de C2 aparece no histórico/export; prompt original permanece recuperável.
- **WORK-01:** escrever, salvar, submeter, receber devolutiva, revisar, recarregar em outra sessão. Primeira avaliação continua apontando primeira versão; duplo clique não cria duplicatas.
- **LIVE-01:** uma disputatio com seis papéis, presença, registro coletivo, contribuições e seis reflexões funciona sem seis eventos duplicados; ausência gera retomada.
- **REVIEW-01:** colega designado vê revisão autorizada, não rascunho/Codex/parecer ainda privado; mudar ID não abre outro aluno; autoavaliação não publica avaliação docente.
- **FILE-01:** arquivo acessível ao titular/equipe autorizada e negado ao anônimo/outro aluno; URL expira; upload interrompido não vira entrega concluída; limpeza não remove baseline válido.
- **DATA-01:** exportação contém fontes/releases e dados próprios completos; exclusão/retirada de consentimento trata objetos, sessões e evidência coletiva sem vazamento. Restore ensaiado antes da abertura.
- **UX-01:** uso por teclado e tela pequena, erro de conexão legível, editor recuperável, alternativa sem áudio/vídeo; aluno nunca enviado a página admin sem autorização.
- **OPS-01:** disponibilidade da aplicação não é requisito para o encontro: registro offline controlado pode ser importado depois com data de ocorrência e autoria, sem inventar presença ou resultados.

Testes de schema/RLS reais em staging/local complementam Vitest; não substituí-los por mock que sempre autoriza. Registrar comandos, ambiente, commit, resultado e limitações em evidência da implementação. Esta entrega de Markdown requer checagem de referências e diff, não execução de toda a suíte de produto.

## 12. Riscos e dívida deliberadamente adiada

| Risco/dívida | Tratamento do piloto | Limite para adiar |
|---|---|---|
| Auth/RLS e divergência do banco | Reconciliação P0 separada da feature | Não adiar proteção de identidade, papéis, portfólio ou Storage |
| Dois modelos legados | Domínio novo explícito; adaptadores pequenos | Reconciliação do curso permanece obrigatória em U02; evitar reescrita global durante a entrega da formação e não deixar dependência ambígua no piloto |
| Sobrecarga de professor/aluno | Medir horas e revisar carga no C1/C3 | Não prometer feedback ilimitado ou aumentar coorte sem evidência |
| Conteúdo ainda em elaboração | Releases e readiness por ciclo, revisão humana | Não apresentar rascunho gerado como leitura verificada |
| Cobrança recorrente | R$500/mês conciliado manualmente, matrícula administrativa auditada | A assinatura da plataforma já pertence a R2/U03 do plano consolidado; conectá-la à coorte só com produto/direito específico aprovado. Não usar checkout one-time como mensalidade nem exigir novo pagamento por devolutiva prevista no piloto |
| Gravações e direitos de leitura | Alternativa escrita, privado, consentimento e referência licenciada | Privacidade e proveniência são pré-requisitos, não backlog |
| Falha do sistema | Exportações, backup e plano de encontro/registro offline | Restore e reimportação ensaiados; não depender apenas de promessa de backup |
| Polimento administrativo | Tabelas simples e seis registros | Sem construtor visual de currículo, agendamento inteligente, BI ou marketplace |
| IA avaliadora/transcrição | Fora do piloto; Hermes pode preparar rascunhos editoriais revisáveis | Não enviar produção pessoal para serviço de IA sem finalidade e aprovação próprias |
| Escala e colaboração em tempo real | Autosave com concorrência otimista, sem CRDT | Editor colaborativo, notificações push, chat e apps nativos adiados |
| Certificados e progressão longa | Parecer final e proposta do próximo percurso | Sem certificação automática, rank, badges ou promessa de titulação |

## 13. Ordem concreta de execução para Hermes

Esta lista detalha os pacotes de formação H00–H11; sua prioridade global e dependências estão na fila U00–U11 de [LICEU_ROADMAP.md](LICEU_ROADMAP.md). H00/H01 reutilizam a base comum, sem iniciar uma segunda correção de autenticação/banco. Esta lista é a fila proposta **depois da revisão deste roadmap**, não autorização para iniciar implementação nesta tarefa. Cada item deve terminar em diff pequeno, critério de aceite e registro de evidência. Não misturar publicação curricular com deploy.

| Ordem | Unidade de trabalho | Caminhos previstos / saída | Dependência e condição de conclusão |
|---|---|---|---|
| H00 | Confirmar base de execução | Registrar HEAD, branches/PRs e inventário somente leitura de banco, policies, grants, funções, buckets e migrações | Antes de qualquer schema; confrontar correções locais sem copiar em bloco |
| H01 | Resolver acesso e base técnica do piloto | `lib/supabaseServer.ts`, `lib/admin/auth.ts`, `lib/users.ts`, guards, config, tipos e `.github/workflows/ci.yml`; PRs focados | H00; AUTH-01/02 aprovados para fundamentos; documentar riscos legados fora do fluxo |
| H02 | Fechar decisões pedagógicas/editoriais | `content/formations/retorica/` como rascunho, schemas, bibliografia, rubricas, prompts, baseline/banca | Revisão docente: cobertura dos três pilares, nome, carga, calendário, corpus, descritores, consentimento/retenção e política de participação |
| H03 | Implementar validador e publicação | `scripts/formation/`, contratos em `lib/formation/`, manifesto/hash/dry-run | H02; fixtures de pacote válido, referência quebrada, alteração de release e reimportação; nenhuma escrita em produção |
| H04 | Criar fundação de dados | Migração aditiva de formation/release/content/cohort/membership/cycle/activity, grants/RLS; `supabase/tests/` | H00–H03; staging reproduzível, matrícula concorrente e isolamento aprovados; decisão final da rota docente |
| H05 | Entregar navegação e primeira coorte de teste | `app/formacoes/`, `components/formation/`, ligação no dashboard; biblioteca/agenda/papéis | H04; UX-01 parcial e ciclo completo navegável com dados sintéticos |
| H06 | Persistir Codex e portfólio | Tabelas/commands de rascunho, revisões, Codex, shares, performance e artifacts; buckets privados | H04–H05; WORK-01/FILE-01 e privacidade do caderno; alternativa escrita testada |
| H07 | Devolver e refletir | Review assignments, assessments, rubricas, sínteses, baseline e banca na interface | H06; REVIEW-01/LIVE-01; simular desempenho e avaliações sem automatizar juízo |
| H08 | Fechar operação | Eventos mínimos, exportação/remoção/restauração, retenção, ICS e registros de contingência | H06–H07; DATA-01/OPS-01; custos/limites de mídia confirmados |
| H09 | Ensaio acompanhado pelo professor | Seis contas sintéticas + professor + avaliador, jornada C1 e banca simulada, acessibilidade e falhas | Todos os aceites; registrar defeitos corrigidos e limites. Não inferir aprovação só de build |
| H10 | Publicar piloto controlado | Release curricular aprovada, deploy revisado, seis memberships reais, datas e comunicação comercial corretas | Aprovação de abertura; verificação do percurso no ambiente implantado; sem cobrança automática acrescentada por inferência |
| H11 | Operar e aprender | Relatórios mensais e C3/C6; releases futuras por PR | Observar evidência real; professor decide adaptar/continuar/pausar |

Não executar importação/migração destrutiva, merge ou deploy como consequência automática de aprovar a redação deste roadmap. Na implementação, preparar resultado e evidência antes da decisão de publicação. Não tocar nos arquivos sincronizados `sources/` do projeto ChatGPT.

### 13.1 Decisões abertas para revisão, com padrão proposto

- Nome público: “Formação pelo Trivium” provisório; manter distinção de Armas da Palavra.
- Cadência/carga: seis ciclos mensais, três encontros de 90 min/mês; confirmar disponibilidade e orçamento de correção do professor.
- Corpus: professor seleciona edições/trechos e objetivos; Hermes estrutura/verifica referências, não inventa canon final.
- Equipe: professor da coorte e eventual convidado de banca; rota docente dedicada se separação do admin atual não for pequena e segura.
- Comercial: conciliação manual no piloto; política de falta, pausa e desistência acordada antes dos convites.
- Dados: gravação opcional, Codex privado, retenção seis meses + 90 dias como proposta; definir operação de acesso pós-piloto e consentimento antes da coleta.

Nenhuma dessas decisões bloqueia revisar arquitetura/conteúdo agora; as pertinentes bloqueiam abertura e coleta real até serem fechadas.

## 14. Referências técnicas consultadas

Código do repositório no commit indicado é a fonte para os achados, não a documentação de terceiros. Documentação oficial consultada em 09/10/2026 para orientar a proposta:

- [Next.js — Authentication](https://nextjs.org/docs/app/guides/authentication): autorização próxima ao acesso a dados, não apenas no layout.
- [Supabase — SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs): clientes e sessão no servidor.
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): grants e policies precisam ser verificados em conjunto.
- [Supabase — Storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals): bucket privado e autorização de downloads.
- [Supabase — mudança de exposição de tabelas](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically): explicitar grants nas novas migrações e verificar configuração do projeto, sem depender de defaults.

**Resultado esperado da revisão:** concordar com fronteira do domínio, versão curricular por coorte/ciclo, percurso dos seis participantes e gates de abertura. A implementação começa por esses acordos e pelos bloqueadores reais do repositório.
