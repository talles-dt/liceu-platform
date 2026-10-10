# Liceu Underground — plano consolidado de plataforma e formação

**Revisão:** 10/10/2026. **Estado:** planejamento para revisão; não é atestado de implementação ou publicação.

Este é o plano coordenador da correção e evolução do Liceu. Consolida a auditoria e o plano R0–R8 da tarefa **“Auditar código do Liceu”** (`01a11cc9-c9e0-7083-81cf-207ddea91ada`) com o [roadmap da formação pelo Trivium](FORMATION_ROADMAP.md). Preserva os 34 achados, as decisões comerciais e pedagógicas do curso existente, o cleanup solicitado e a nova formação de seis pessoas. Gramática, lógica e retórica são pilares obrigatórios dessa formação.

**Hierarquia documental:** este arquivo governa escopo global, prioridades, dependências e critérios de lançamento. `FORMATION_ROADMAP.md` governa o detalhamento pedagógico e funcional da formação. R0–R8 e H00–H11 permanecem como identificadores de origem; a fila de execução é U00–U11, abaixo. Não executar três roadmaps concorrentes nem interpretar uma proposta de formação como cancelamento de trabalho já aprovado na plataforma.

## 1. Base verificada e estado do trabalho

- GitHub `talles-dt/liceu-platform`, `main`: `6969ac8a86ad2a970811f81bd3fce10d280c18fe`, reconferido em 10/10. O PR #4 é documental, na branch `codex/formation-roadmap`.
- Auditoria anterior: 34 achados, catalogados abaixo. As prioridades e títulos são os do relatório de 08/10; precisam de revalidação por achado, não de declaração genérica de “resolvido”.
- Remoção do Zernio: commit **local** `d461b9c`, confirmado no clone `audit-liceu-platform-2026-10-08`. Não está em `main` no estado verificado.
- Nesse clone há alterações locais adicionais de segurança, cobrança, serviços, progresso, navegação e schema; o trabalho de execução terminou interrompido por limite de uso. Arquivos existentes e notas de status não comprovam validação final. Preservar esse trabalho, comparar e incorporar por pacotes pequenos.
- Snapshot de schema de 08/10 e migração local `20261008231646_subscription_learning_security.sql` são evidências/candidatos de reconciliação. Não são prova do banco implantado em 10/10. Uma nova inspeção somente de leitura precede qualquer migração.
- Esta consolidação altera apenas os dois documentos. Não aplica aquele código, não migra banco, não ativa vendas e não faz deploy. Resultados históricos de testes não são herdados como aprovação da futura implementação.

Fontes de origem: conversa identificada acima; relatório local `auditoria-liceu-2026-10-08/AUDITORIA.md`; código do clone e `docs/implementation/STATUS.md` daquela execução; auditoria de `main` descrita em `FORMATION_ROADMAP.md`. O relatório externo não precisa ser publicado com dumps ou dados do ambiente: esta matriz preserva seus IDs/títulos e traduz cada item em pacote e prova de fechamento.

## 2. Uma plataforma, três ofertas com contratos distintos

| Aspecto | Curso existente — Armas da Palavra | Serviços humanos avulsos | Formação pelo Trivium |
|---|---|---|---|
| Unidade | Seis módulos existentes; currículo `liceu_*` canônico após reconciliação | Pedido de revisão ou sessão de mentoria | Formation → Cohort → Cycle → Activity → Submission/Performance |
| Comercial | Assinatura mensal; preço ainda a definir/configurar | Preço/escopo/prazo de revisão e duração/preço da sessão definidos antes de compra | Seis participantes, R$500/mês por seis meses; condição piloto/fundadora |
| Trial | 14 dias com cartão, condições e data de cobrança claras | Não inferir trial | Não presumir trial da assinatura aplicável à coorte |
| Acesso | Assinatura/concessão vigente, publicação, suspensão e pré-requisitos | Direito ao serviço comprado, independente da assinatura | Matrícula autorizada e papel na coorte; direito específico, não conclusão de módulos |
| Progressão | Todas as lições e ≥70% no quiz; exercício/revisão humana não bloqueia avanço | Estados operacionais e entrega pactuada | Evidências, revisão e síntese docente; sem quiz obrigatório ou limiar automático |
| Devolutiva | Prática disponível; revisão humana é adicional | Uma compra cobre uma devolutiva dentro do escopo aceito | Feedback docente, de pares e autoavaliação previstos no piloto integram o percurso; não cobrar avulso por essas devolutivas |
| Depois do término | Histórico, trabalhos e feedback próprios legíveis | Serviço já pago continua devido | Portfólio próprio acessível conforme política de retenção/exportação acordada |

**Fronteiras obrigatórias:** mesma identidade, padrões de segurança e componentes de apresentação; regras de aprendizagem separadas. Compra não cria nem reinicia progresso. Pagamento não atesta competência. Papel docente é atribuído por escopo; não exige administração financeira global. Toda troca de conteúdo deve preservar proveniência e versões.

Os R$500 da coorte não definem o preço da assinatura geral, da revisão avulsa ou da mentoria. A possibilidade de conciliação manual do piloto não remove R2: assinatura e serviços continuam no plano da plataforma. Conectar cobrança automática à coorte só após definir produto, cancelamento, direito de acesso e testes específicos; não conceder a coorte por qualquer assinatura ativa.

## 3. Decisões preservadas do plano anterior

### 3.1 Curso e acesso

Preservar os seis módulos e conferir textos, seções, vídeos e quizzes efetivamente disponíveis antes de anunciar oferta. Adotar `liceu_*` como modelo canônico do **curso**, com mapa explícito de IDs legados. Não transformar `formation_*` em uma terceira representação concorrente desses módulos: é outro domínio.

Registrar conclusões por aluno/lição com unicidade, quiz corrigido no servidor e tentativas imutáveis, preservando melhor resultado válido segundo regra aprovada. Distinguir conclusão de estudo, resultado do quiz e avaliação humana. Duas abas, reentrega de pagamento e reativação não podem apagar o histórico. Exercícios não exigem compra de revisão para avançar.

### 3.2 Assinatura e trial

Checkout autenticado, catálogo permitido escolhido no servidor e portal para cartão/faturas/cancelamento. Uma assinatura tem estados e eventos financeiros próprios; redirecionamento do checkout não prova pagamento. Webhooks devem conferir assinatura, ownership, duplicação, ordem e persistência; falha entre pagamento e gravação precisa de reconciliação retomável. Compras antigas continuam conciliáveis, sem criar novas vendas do modelo descontinuado.

Trial de 14 dias com cartão: uma utilização por conta verificada; cliente e identificador de cartão ajudam a detectar repetição, com tratamento humano para compartilhamento legítimo. IP limita velocidade em janela de tempo, com origem confiável e contadores persistentes; **não usar “um teste por IP”**. Não guardar cartão bruto ou assumir IP como identidade. Documentar informação ao comprador e mecanismo de regularização.

Cancelamento durante trial impede cobrança futura e mantém acesso até seu fim; cancelamento de período pago preserva acesso até o término contratado. Não conceder novo período não pago por inferência de evento ou retorno do checkout. Inadimplência preserva histórico. Configuração de preços, datas e política financeira é explícita; vendas reais ficam desativadas até validação. Reembolsos/disputas aparecem na operação para tratamento, sem apagar aprendizagem.

### 3.3 Serviços humanos

Revisão: pedido com exercício/versão, escopo, prazo e aceite do professor antes de pagamento; uma compra cobre uma devolutiva, nova rodada contratada é novo pedido. Fila docente e parecer vinculado à versão correta.

Mentoria: candidatura → seleção sem taxa de entrevista → oferta com duração/preço/disponibilidade → pagamento por sessão → agendamento → atendimento. Estados mínimos: solicitado, aceito, aguardando pagamento, pago, em atendimento, concluído, cancelado; detalhar falha/reembolso conforme contrato. Cal.com só após verificação de assinatura, identificação da reserva e conciliação de falhas. Cancelar assinatura não cancela automaticamente serviço já pago.

### 3.4 Experiência e cleanup

Incorporar remoção de APIs, dependência, biblioteca, tela e menu Zernio; verificar retirada operacional de configuração e ausência de endpoints expostos. Conferir o commit local antes de reaplicar.

Consolidar cabeçalhos redundantes, navegação contextual, landmark principal, menus mobile e links por papel. Remover ZIPs e snapshots de design redundantes somente após confirmar que não são usados; manter recuperação via Git. Resolver configuração Next duplicada. Preservar identidade visual e melhorar leitura/contraste/acessibilidade. Não sobrescrever a cópia de implementação incompleta nem os arquivos sincronizados em `sources/`.

## 4. Formação pelo Trivium: compromisso curricular obrigatório

O piloto mantém **leitura → seminário → imitatio → composição → disputatio → declamatio → reflexão**. Esse movimento trabalha três pilares em todos os seis ciclos:

- **Gramática:** interpretação, relações sintáticas, precisão semântica, referência, coesão, gênero/registro e revisão da expressão. Não se resume a ortografia.
- **Lógica:** termos/definições, proposições, reconstrução de argumentos, inferência, validade e verdade, evidência, objeções e contraexemplos. Não se resume a decorar falácias.
- **Retórica:** invenção, disposição, expressão, memória, pronunciação, audiência e responsabilidade na interlocução. Persuasão não substitui verdade ou validade.

O [roadmap da formação](FORMATION_ROADMAP.md#33-trivium-três-pilares-estruturantes) contém competências, matriz C1–C6, tarefas integradoras e rubricas. Não adicionar três cursos paralelos nem triplicar a carga: gramática e lógica devem orientar a leitura, preparação, escrita, discussão e revisão do mesmo corpus. A cadência e profundidade precisam de revisão docente e diagnóstico de entrada.

Baseline e banca final devem produzir evidências dos três pilares; pareceres não se compensam por média geral. Exemplo: uma fala persuasiva pode continuar logicamente inválida e linguisticamente ambígua, e o registro deve mostrar isso. Repertório, escuta e reflexão atravessam os três.

Currículo, competências, bibliografia, tipos de exercício, prompts e rubricas ficam em conteúdo estruturado no Git e releases imutáveis no banco. Cada ciclo fixa a versão cursada, avaliações apontam revisão/performance e rubrica exatas, e mudanças em turma ativa são explícitas. Validar cobertura por **objetivo + tarefa/evidência + critério**, não só pela presença da tag de um pilar. Codex é privado e pode reunir citações, definições, mapas de argumentos, contraexemplos e revisões; avaliação não autoriza vigilância do caderno.

## 5. Matriz completa dos achados A01–A34

**Estado comum:** aberto para reconciliação e revalidação no pacote indicado; não significa que nenhum patch local exista. A02 tem commit local identificado; os demais não recebem status “corrigido” sem teste no commit de integração. Prioridades são as da auditoria original. Ausência de reproduções nesta entrega documental não rebaixa riscos.

| ID / prioridade | Achado da auditoria | Pacote | Prova de fechamento exigida |
|---|---|---|---|
| A01 / P0 | Identidade fabricada em cookie recebe poderes administrativos | U01 | Cookie fabricado/expirado negado em página, API e ação privilegiada. |
| A02 / P0 | Zernio permitia leitura e publicação sem autenticação | U01 | Commit local integrado e endpoints removidos; retirada operacional verificada. |
| A03 / P1 | Funções privilegiadas de acesso executáveis por anônimo | U01 | Anônimo e aluno não executam RPC de concessão; grants/funções testados diretamente. |
| A04 / P1 | Política de perfil permite ao aluno alterar seu próprio role | U01 | UPDATE/INSERT de role pelo aluno negado, inclusive por acesso direto. |
| A05 / P1 | RLS de users entra em recursão infinita | U01 | Leitura própria/admin autorizada funciona sem recursão; terceiros negados. |
| A06 / P1 | Quizzes permitem escrita geral e leitura do gabarito | U01 | Aluno não lê gabarito nem escreve quiz; correção acontece no servidor. |
| A07 / P1 | Pagamento, concessões, suspensão e pré-requisitos não governam o acesso | U02 | Matriz de assinatura/concessão/suspensão/publicação/pré-requisito em API e banco. |
| A08 / P1 | Concluir módulo apaga o histórico de outros módulos | U02 | Conclusão concorrente/idempotente preserva outros módulos e lições. |
| A09 / P1 | Checkout aceita mentoring_program cobrando preço de vídeo | U03 | Servidor rejeita combinação produto/preço incompatível. |
| A10 / P1 | Reentrega de pagamento pode zerar progresso e repetir efeitos | U03 | Evento repetido/fora de ordem não duplica serviço nem reinicia progresso. |
| A11 / P1 | Webhook confirma sucesso após falhas de persistência | U03 | Falha persistida é recuperável; resposta não encobre erro; replay demonstrado. |
| A12 / P1 | Recuperação de compras chama RPC incompatível e pendências não são reclamadas no login | U03 | RPC e login conciliam pendência ao usuário correto, com ownership e idempotência. |
| A13 / P1 | Webhook Cal.com não verifica assinatura e descarta falhas | U05 | Assinatura Cal inválida negada; reserva e falha são conciliadas sem perda. |
| A14 / P1 | Migrações não reconstroem um banco novo | U02 | Baseline + migrações reconstroem staging e restore é ensaiado. |
| A15 / P1 | Modelos antigo e liceu_* estão conectados por IDs incompatíveis | U02 | IDs explícitos ligam leitores/editores/compra; sem junção por posição. |
| A16 / P1 | Trabalhos dos alunos são armazenados para leitura pública | U02 | Arquivo privado e acesso direto indevido negado; links temporários verificados. |
| A17 / P1 | HTML de conteúdo não é sanitizado | U01 | Payload de HTML malicioso não executa nas superfícies de conteúdo. |
| A18 / P1 | Dependências instaladas acumulam alertas de segurança | U01 | Dependências/lockfile revisados; alertas aplicáveis corrigidos ou risco documentado. |
| A19 / P2 | Cadastro administrativo conflita com trigger de criação de perfil | U02 | Criação administrativa e trigger são idempotentes, sem cadastro duplicado. |
| A20 / P2 | Logs de auditoria falham silenciosamente | U02 | Evento auditável persiste e falha não é silenciosa; payload minimizado. |
| A21 / P2 | Agendamentos Vercel chamam métodos não implementados | U09 | Agendador real chega ao método protegido; efeitos idempotentes por janela. |
| A22 / P2 | Limpeza de arquivos não percorre as pastas de uploads | U09 | Limpeza paginada/recursiva usa retenção correta e preserva evidência válida. |
| A23 / P2 | Reengajamento classifica alunos ativos como inativos | U09 | Atividade efetiva exclui aluno do reengajamento indevido; duplicação evitada. |
| A24 / P2 | Exportação e exclusão de conta não cobrem o modelo atual | U02 + U08 | Exportação/exclusão cobrem curso, formação, arquivos e sessões, com falhas tratadas. |
| A25 / P2 | Fluxos de estudo anunciam salvamento sem confirmar persistência | U04 | Erro não mostra salvo; recarga e duas sessões preservam o trabalho. |
| A26 / P2 | Leitura exibe só uma seção e não monta vídeo nem quiz de lição | U04 | Todas as seções, vídeo disponível e quiz correto acessíveis com guard. |
| A27 / P2 | Blog está desconectado dos arquivos publicados | U04 | Post publicado no acervo aparece na listagem e rota correta. |
| A28 / P2 | Server action do blog permite sair do diretório de posts | U01 | Entrada que tenta sair do diretório é rejeitada no servidor. |
| A29 / P2 | Compartilhamento do diagnóstico aponta para rota inexistente | U04 | Link compartilhado resolve com escopo/token seguro e estados inválidos testados. |
| A30 / P2 | Primeiro login administrativo bem-sucedido não redireciona | U04 | Primeiro login de admin autorizado redireciona corretamente; aluno não é promovido. |
| A31 / P1 | CI não cobre main e build limpo exige configuração ausente | U01 | CI executa em main/PR, instalação limpa, tipos/lint/testes/build com env documentada. |
| A32 / P2 | Consultas administrativas usam relações diferentes das FKs versionadas | U02 | Consultas administrativas correspondem às FKs e resultados são completos/paginados. |
| A33 / P2 | CSP bloqueia integrações configuradas no próprio frontend | U04 | Integrações necessárias funcionam sob CSP restrita, sem liberar origens arbitrárias. |
| A34 / P2 | APIs públicas de email e gravação têm controles de abuso frágeis | U01 | Rate limit persistente, validação e proteção de endpoints públicos testados. |

Observações complementares também entram na reconciliação: paginação de usuários/relatórios, contadores transacionais de vagas de parcerias, trigger de coluna inexistente, retorno de erro das bibliotecas de email, consistência da política de senha, formulários que acabam em JSON bruto e estados de progresso/flashcards após recarregar. Responsáveis: U02 para integridade/dados, U04 para jornada, U09 para jobs/email. Indicadores de uso não serão apresentados como competência; streak não deve entrar na formação.

## 6. Correspondência dos dois planos originais

| Origem | Conteúdo preservado | Fila unificada |
|---|---|---|
| R0 — Contenção e qualidade | Zernio, auth/RLS/RPCs, gabaritos, sanitização, dependências, tipos, CI e cleanup | U00–U01 |
| R1 — Banco e progresso | Baseline, modelos/IDs, progresso atômico, perfis/logs, privacidade/exportação/exclusão | U02; extensão da formação em U06/U08 |
| R2 — Assinatura | Mensalidade, trial, portal, renovação/falha/cancelamento/reativação, conciliação | U03 |
| R3 — Experiência do aluno | Leitura/vídeo/quiz, continuar estudando, rascunho, diagnóstico/blog, navegação e flashcards por vencimento | U04 |
| R4 — Serviços humanos | Revisão, fila docente, rubrica, mentoria por sessão, Cal | U05 |
| R5 — Primeiro lançamento | Oferta, emails, acessibilidade/mobile/suporte, jobs, ensaio e abertura controlada | U09–U10 |
| R6 — Aprendizagem aprofundada | Anotações por lição, busca, versões, portfólio exportável e metas semanais opcionais | U08 no que o piloto exige; extensão ao curso em U11 |
| R7 — Prática oral | Gravação/reprodução/envio e rubricas por dimensão, sem nota automática | U07/U08: upload e registro oral do piloto; gravador no navegador do curso em U11 |
| R8 — Operação e expansão | Rascunho/publicação, calendário editorial, capacidade docente, relatórios; expansão posterior | U06: releases do piloto; U09: capacidade mínima; editor amplo/expansão em U11 |
| H00/H01 | Verificar base e autorização | U00–U02, uma única execução |
| H02/H03 | Contrato pedagógico, schemas, validador e importador | U06, com gramática/lógica/retórica obrigatórias |
| H04/H05 | Domínio de coorte, RLS, biblioteca/agenda/papéis | U06–U07 |
| H06/H07/H08 | Codex, evidência, avaliação, exportação e operação | U07–U09 |
| H09/H10/H11 | Ensaio, abertura e operação do piloto | U09–U11 |

R6–R8 continuam evolução posterior do curso. O subconjunto indispensável ao piloto sobe de prioridade com escopo pequeno, sem exigir editor universal, gravador próprio ou migração de todos os trabalhos antigos. Reutilizar infraestrutura de revisão/artefatos apenas se preservar target, autorização e versão; não cobrar serviço avulso para liberar feedback curricular.

## 7. Ordem concreta de execução para Hermes

Cada unidade produz PR(s) pequeno(s), evidência por requisito, plano de reversão quando necessário e atualização de estado. O estado de todo pacote nesta consolidação é **planejado** ou **a reconciliar**; código local é candidato, não conclusão. Não somar automaticamente o prazo dos planos antigos; estimar após U00.

| Ordem | Entrega concreta / caminhos principais | Dependências | Aceite para avançar |
|---|---|---|---|
| **U00 — Inventário e preservação** | Capturar main, branches/PRs, diff local e commit Zernio; inspecionar banco/Storage/histórico somente leitura; inventariar contratos e configurações sem segredos | Nenhuma | Mapa por arquivo/achado: remoto, local, validado, falta; backup das alterações locais e baseline de ambiente. Não resetar checkout incompleto |
| **U01 — Segurança, qualidade e cleanup** | Auth/roles/guards/RPC/RLS, dependências, HTML, remoção Zernio; `lib/`, rotas, CI, config; cabeçalhos/artefatos em PR visual separado | U00 | Achados atribuídos acima testados; tipos/lint/testes/build passam no commit; uma navegação correta por área; remoção operacional ainda marcada pendente se não implantada |
| **U02 — Dados e direitos** | Baseline/migração aditiva, canonicalização do curso, IDs, progresso transacional, perfis/logs, Storage privado, exportação/exclusão | U00–U01 | A07/A08/A14–A16/A19/A20/A24/A32 testados no domínio existente; restauração; dados antigos preservados; acesso separado de histórico |
| **U03 — Assinatura e trial** | Rever `lib/billing/` e rotas locais candidatas; checkout, portal, ledger, antiabuso, pendências antigas e configuração | U02 | Stripe de teste: trial/renovação/falha/cancelamento/reativação/replay/ordem; não reinicia progresso; preços reais pendentes mantêm vendas fechadas |
| **U04 — Percurso do curso** | Dashboard, leitura completa, vídeo, quizzes, flashcards, rascunho/retorno, blog/diagnóstico e navegação acessível | U02; U03 para ensaio comercial | Cadastro → assinatura de teste → estudo → retorno → quiz → prática funciona; persistência e CSP demonstradas; revisão paga não bloqueia avanço |
| **U05 — Revisão e mentoria** | Pedidos/aceite/preço/fila/parecer, sessões e Cal autenticado; comparar `app/servicos`, `app/professor`, `lib/staff.ts` locais se ainda pertinentes | U02–U03; integrar U04 | Serviço comprado entregue mesmo após cancelamento da assinatura; professor só vê atribuições; cancelamento/reembolso e falhas são rastreáveis |
| **U06 — Currículo e fundação do Trivium** | Contrato C1–C6, competências/fontes/rubricas, schemas/dry-run/releases; formation/cohort/membership/cycle/activity e RLS | Editorial pode começar após U00; banco após U02 | Três pilares em objetivos/evidências/critérios; docente aprova; release imutável e importação idempotente; seis vagas transacionais; terceira pessoa/coorte isolada |
| **U07 — Coorte, caderno e evidência** | `app/formacoes`, `lib/formation`, componentes; biblioteca/agenda/papéis; Codex, rascunhos/revisões, arquivos privados e performance coletiva | U06 | Aluno prepara e participa de ciclo completo; recarrega sem perda; caderno privado; registro oral opcional com alternativa escrita |
| **U08 — Avaliação e portfólio** | Peer/self/teacher/panel, rubricas por pilar, reflexão, baseline/banca, exportação/versionamento/retenção da formação | U07 | Parecer aponta revisão/performance exata; evidencia separadamente gramática/lógica/retórica; par não vê material indevido; exportar/remover/restaurar testados |
| **U09 — Operação e ensaios** | Jobs/limpeza/reengajamento, emails, observabilidade, capacidade docente, acessibilidade/mobile, backups e jornada de teste | U01–U08 conforme oferta a abrir | Matriz A completa com evidência ou isolamento justificado; jornada de seis contas sintéticas e professor; nenhum bloqueador de segurança/cobrança/perda de dados na oferta |
| **U10 — Publicação controlada** | Revisar diffs/migrações/conteúdo/configuração, aprovar oferta e deploy; verificação no ambiente implantado | U09 e aprovação de publicação pertinente | Cada oferta tem gate próprio abaixo; commit/release/data registrados; rollback não apaga pagamentos ou trabalhos; nenhuma alegação de pedagogia validada só por deploy |
| **U11 — Operação e evolução** | Acompanhar piloto mensal/C3/C6, incidentes, carga e aprendizagem; R6–R8 restantes e futuras releases | U10 para dados reais | Decidir continuar/adaptar/pausar com evidências; professor aprova mudanças; curso/coorte mantêm contratos distintos |

A fila define dependências, não obrigação de bloquear a elaboração curricular até terminar cobrança. U06 editorial pode avançar enquanto se prepara a base; não abrir a coorte antes de segurança, evidência e avaliação. Serviços avulsos/Stripe completo não impedem piloto com conciliação manual **se seus caminhos inseguros estiverem desativados e os gates da coorte cumpridos**. Adiamento não encerra os achados: registrar exposição, mitigação, responsável e próximo pacote. Não abrir uma nova oferta sobre falha transversal de auth/RLS.

### 7.1 Gates de abertura por oferta

- **Comum:** identidade/roles/RLS, Storage privado, persistência/backup/restauração, exportação e tratamento de exclusão, CI, acessibilidade essencial, monitoramento sem dados sensíveis. Toda vulnerabilidade crítica/alta aplicável resolvida e verificada; componente desativado deve ter bloqueio efetivo testado.
- **Curso:** U03/U04 aceitos; seis módulos com conteúdo anunciado verificado; 70% e conclusões protegidos; histórico após expiração; vendas reais só após catálogo/preço/trial/cancelamento conferidos.
- **Serviços:** U05 aceito; escopo/duração/preço/prazo e capacidade docente definidos; pagamento/entrega/reembolso conciliáveis; Cal verificado se usado.
- **Coorte:** U06–U08 e testes TRI/AUTH/CUR/WORK/LIVE/REVIEW/FILE/DATA/UX/OPS do roadmap da formação aceitos; C1 pronto, programa dos seis ciclos explícito, baseline/banca e política de dados aprovados; seis matrículas; R$500/mês e devolutivas incluídas claramente apresentados. Cronograma das próximas publicações fixado, sem prometer conteúdo ainda em rascunho.

A aprovação desta consolidação não é, por si, aplicação de migração ou publicação em produção. Preparar implementação e evidência para decisão concreta de abertura. Nenhuma mudança de preço ou cobrança real deve ser inferida de título de PR.

## 8. Provas de qualidade e rastreabilidade

Não basta marcar pacote concluído. Criar durante a implementação um registro por ID (A01–A34 e requisitos da formação): estado `planned/local_candidate/in_review/verified_staging/deployed_verified/deferred`, commit/PR, ambiente, teste/evidência, responsável, risco residual e data. `deferred` exige motivo, mitigação e gatilho de retomada; nunca significa resolvido.

Matriz mínima de usuários: anônimo, participante A/B, outra coorte, professor atribuído/não atribuído, avaliador e admin. Testar handlers e acesso direto ao banco/Storage. Nenhum mock isolado prova RLS. Casos de falha: sessão inválida/suspensa, upload interrompido, duas abas, retry, evento financeiro duplicado/atrasado, assinatura cancelada com serviço pago, release nova em coorte antiga, revisão após parecer, arquivo coletivo com restrição de consentimento.

Demonstrar restauração, persistência após recarregar, tratamento de erro sem falso sucesso e percurso real de cada oferta no ambiente de lançamento. Separar resultados locais, staging, deploy e observação com alunos. Conteúdo curricular tem revisão docente própria, além de validação de schema.

## 9. Instrumentação, dívida e decisões abertas

Medir curso (primeira lição, retorno, tentativas válidas e progressão), comercial (trial/conversão/falhas/eventos pendentes), serviços (fila/prazo/carga) e formação (evidências dos três pilares, retomadas, utilidade da devolutiva e carga). Essas séries respondem a perguntas distintas; não comparar módulos concluídos com formação intelectual. Dados do Codex não são analytics.

No piloto, baseline + evidências por ciclo + banca permitem juízo qualitativo; seis pessoas não demonstram causalidade ou generalização estatística. C3 e C6 geram decisão de continuidade com lacunas, desistências e “não observado” preservados. Não criar dados faltantes para preencher relatório.

Adiar deliberadamente: gamificação, IA avaliadora, comunidade/chat, aplicativo nativo, editor curricular universal, colaboração em tempo real, integração bidirecional de calendários, gravador próprio, plano anual e expansão de turmas antes de avaliar capacidade. R6–R8 seguem no backlog, sem remover o subconjunto de portfólio/publicação/oralidade necessário ao piloto. Segurança, retenção, gramática, lógica e evidência avaliativa não são dívida opcional.

Decisões ainda necessárias para implementação/abertura: valores da assinatura geral/revisão/mentoria e duração da sessão; corpus/edições e descritores completos dos três pilares; nome público da formação; cadência/horas docentes; política de pausa/desistência/retorno, gravação e retenção. Padrões propostos estão no roadmap da formação; R$500 e seis pessoas/seis meses já são parâmetros do piloto, não perguntas a reabrir.

**Próximo trabalho do Hermes:** começar por U00, preservar o código local e produzir o mapa de incorporação; em seguida U01/U02 para a base comum e U06 editorial para o Trivium. Não reiniciar o projeto nem executar todo o plano num patch único.
