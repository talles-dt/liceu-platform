# Execução do roadmap consolidado — 10 de outubro de 2026

> Atualização de 12/10/2026: veja [OPERATIONS.md](OPERATIONS.md) para o incremento posterior. Auditoria transacional, fila retomável, conciliação explícita e exclusão revisada já foram implementadas e testadas localmente. As pendências históricas abaixo descrevem o checkpoint anterior, não o estado integral atual. U00–U05 seguem sem aceite de produção.


Estado: **implementação local em revisão; nenhuma oferta liberada por esta entrega**.
Branch: `codex/liceu-implementation`. Base de produção auditada: `6969ac8`.
A cópia de trabalho de 8 de outubro permanece preservada. `INVENTORY.json` registra os arquivos recuperados; `6f5e575` incorpora essa base, incluindo a remoção do Zernio (`d461b9c`).

## Posição no roadmap

| Pacote | Estado | Evidência e limite |
|---|---|---|
| U00 — inventário/consolidação | local_candidate | Checkout anterior preservado; inventário com hashes; roadmaps incorporados. |
| U01 — segurança | local_candidate | Identidade verificada, concessões/RLS e gabaritos protegidos na migração; testes SQL sintéticos. Endpoints públicos usam limites persistentes e envio autenticado. Suspensão é conferida no servidor; restam logs administrativos e 5 alertas transitivos de desenvolvimento. |
| U02 — dados/progresso | local_candidate | Baseline e três migrações testados em PostgreSQL local; rascunhos concorrentes, versões imutáveis e perfil Auth verificados. Exportação própria ampliada. Exclusão resumível e reconciliação legada ainda pendentes. |
| U03 — assinatura | local_candidate | Checkout, trial, portal e processamento de eventos incorporados; venda desligada por configuração. Lease por assinatura, pagamento de serviço transacional e testes de replay/falhas adicionados. Valores do curso, recuperação operacional e homologação Stripe pendentes. |
| U04 — experiência do curso | local_candidate | Leitura integral, vídeo, quiz de módulo, produções e histórico. Práticas antigas redirecionadas às produções `liceu_*`; APIs incompatíveis respondem 410 e preservam histórico. Auth/PostgREST e APIs Next testados com identidades locais reais. Falta validação visual autenticada completa, incluindo navegação/recarga. |
| U05 — serviços | local_candidate | Solicitação, oferta e entrega incorporadas; confirmação/cancelamento legado desativados. Atribuição ao docente, rubrica, cancelamento e reembolso implementados. Preço, duração, capacidade, ordenação Cal e conciliação real pendentes. |
| U06 — Trivium editorial | local_candidate | Seis ciclos estruturados, objetivos dos três pilares, rubrica, baseline e banca. Arquivo **draft**; bibliografia dos ciclos 2–6 e aprovação docente pendentes. Publicação é recusada. |
| U07 — coorte/atividades | local_candidate | Releases imutáveis, seis vagas, agenda, papéis/presença e performances coletivas; SQL/API/UX implementados. Falta homologar calendário, convites e gestão do ciclo de vida da coorte. |
| U08 — evidência/devolutivas | local_candidate | Rascunhos com revisão, entregas imutáveis/idempotentes, Codex privado, peer feedback, autoavaliação e banca; anexos PDF/texto privados e exportação textual. Falta testar Storage real, implementar consentimento/retificação/exclusão e completar acessibilidade. |
| U09 — operação | planned | Limpeza automática por idade desativada para preservar evidências. Retenção, reengajamento, alertas e recuperação operacional ainda pendentes. |
| U10 — abertura | planned | Sem migração remota, merge em produção, deploy ou cobrança real. |
| U11 — piloto/evolução | planned | Depende de U10 e de dados reais dos seis participantes. |

`local_candidate` não encerra achados A01–A34. Nenhum pacote recebe `verified_staging` ou `deployed_verified` nesta entrega.

## O que a formação já permite no código

- Uma coorte aponta para uma release imutável com versão, hash, manifesto completo e commit editorial. Ciclos e definições vivem nesse manifesto; ocorrências e evidências vivem no banco.
- Cada ciclo integra gramática, lógica e retórica. Validador exige objetivos, competências, evidências e critérios para os três pilares, os sete movimentos, baseline e banca.
- Docente distribui papéis e registra encontros e performances coletivas; os pareceres referenciam uma entrega ou performance exata e sua rubrica curricular.
- Rascunhos e Codex são privados, inclusive perante o docente. O par recebe apenas a evidência atribuída. Participante desligado conserva seu próprio arquivo e perde acesso a evidência atribuída de terceiros e a novas escritas.
- Não há nota geral de competência, ranking, gamificação ou cobrança por feedback curricular.
- Registro escrito de performance é o suporte inicial; áudio/vídeo e consentimento não foram simulados como implementados.

## Verificação realizada

- Testes unitários/API: 55 casos passaram na execução local; cobrem validação editorial, origem, identidade, conflitos, matrícula administrativa e publicação recusada do rascunho, além dos fluxos incorporados.
- PostgreSQL 16 local, dados sintéticos: baseline + três migrações aplicam; autoelevação negada, RPC anônimo negado, gabarito negado, entitlement/70%/idempotência e ordenação de eventos testados.
- Formação no banco: sétima vaga negada, isolamento de coortes, privacidade docente/par, conflito de rascunho, retry de entrega, release/parecer imutáveis, critérios dos três pilares, performance coletiva e arquivo próprio após desligamento testados.
- Compilação de produção e TypeScript passaram durante o desenvolvimento. Build final, TypeScript e 37 testes passaram no código de `dadc2e6`; lint: zero erros e 18 avisos. Atualização U00–U05: parser frontmatter substituído por YAML limitado, sem aliases/engines executáveis. Audit atual: 5 alertas altos no encadeamento do lint; zero moderados/críticos. O audit não está limpo.
- Proposta pública `/formacoes/curriculo` aberta no navegador local, com seis ciclos e diagnóstico expansível. Isso **não** valida a experiência autenticada com contas Supabase reais.
- Consulta remota apenas de metadados: zero diferenças nas colunas comparadas com o snapshot de 8 de outubro. Não confundir com equivalência integral de funções, policies, buckets e configuração operacional; `SCHEMA_CHECK.json` registra os metadados da consulta.

## Pendências que bloqueiam publicação

1. Revisar concessões, policies, funções, Auth e buckets no ambiente alvo; fazer backup e ensaio de restore. As migrações não foram aplicadas remotamente.
2. Homologar login/logout/recuperação/suspensão com contas reais de teste; aluno, docente, par, avaliador e intruso; duas sessões e recarga do editor.
3. Fechar biblioteca e revisão docente. `0.1.0.json` contém um texto original de oficina em rascunho; não representa bibliografia clássica aprovada nem programa pronto para matrícula.
4. Definir início/fim da coorte, convites e operação dos seis meses. O schema mantém datas e estados, mas a gestão completa de ingresso, pausa e encerramento ainda precisa de interface e aceites.
5. Homologar upload/download privado, falhas intermediárias e reconciliação de anexos pendentes. Limite inicial: PDF/texto, 10 MB. Exportação do portfólio inclui textos e metadados, não um ZIP de binários.
6. Implementar exclusão/retificação resumível de conta, evidências, arquivos e sessões com a política de retenção aprovada. O endpoint legado destrutivo agora recusa com 503, sem apagar parcialmente. A exportação geral agora inclui evidências próprias da formação, releases e metadados dos arquivos; binários continuam separados.
7. Editor administrativo de quiz reconciliado com o modelo canônico; resta conferir todo o conteúdo publicado e demais operações administrativas.
8. Email, diagnóstico e newsletter agora têm limites persistentes, validação e falha explícita. Restam auditoria administrativa transacional e reengajamento legado; não habilitar rotinas externas antes desses aceites.
9. Homologar Stripe/Cal em modo de teste, replay, falhas de persistência, cancelamentos e reembolsos; informar valores da assinatura geral, revisão e mentoria e duração da sessão. `STRIPE_SALES_ENABLED=false` permanece o padrão.
10. Tratar alertas transitivos restantes de dependências com revisão de compatibilidade; não fazer downgrade automático do Next/ESLint apenas para silenciar o audit.

## Próxima ordem de execução para Hermes

1. Revisar os commits de recuperação e formação separadamente, mantendo este registro honesto.
2. Fechar U01/U02 e pendências transversais acima antes de implantar a nova oferta.
3. Preparar homologação isolada com Auth/Storage reais e conteúdo sintético; executar a matriz de aceite do `FORMATION_ROADMAP.md` e registrar resultados por requisito.
4. Em paralelo, obter aprovação editorial humana e condições comerciais pendentes.
5. Só então aplicar o procedimento de U10: migração revisada, deploy, verificação real do aluno, matrícula dos seis e acompanhamento de baseline. U11 exige observação ao longo dos seis meses, não pode ser encerrado por testes de software.

## Reprodução local

`npm ci`, `npm test`, `npm run formation:validate`, `npm run lint`, `npm run typecheck`, `npm run build`.

Para banco, criar um container descartável PostgreSQL 16 chamado `liceu-implementation-db` (sem portas públicas) e executar `python scripts/verify-database.py` seguido de `python scripts/verify-formation.py`. O primeiro script recria **somente** o banco sintético `liceu_verify` nesse container. Nunca apontar esses scripts para banco remoto. O segundo script marca apenas uma fixture em memória como aprovada para testar persistência; não aprova o manifesto editorial do repositório.

## Incremento U00–U05 — evidência e limites

A solicitação de executar U00–U05 iniciou este incremento; **não equivale a aceite completo dos seis pacotes**. Consulte U00_U05_ACCEPTANCE.md para a separação entre implementado, verificado e pendente.

A proposta comercial da Formação Intelectual está em content/offers/formation-proposal.json: seis fundadores, R$500/mês por seis meses; regular R$790, tutoria R$1.490 e anual R$8.400 permanecem propostas. Horizonte de 18–36 meses com compromissos anuais renováveis após o piloto. Não preenche preços da assinatura geral ou serviços avulsos. Frequência dos encontros, carga de correção e limites individuais continuam decisões abertas.

Verificação adicional: python scripts/verify-u00-u05.py depois dos dois scripts SQL acima; node scripts/verify-local-supabase.mjs usa exclusivamente Supabase local e aplicação local na porta 3110, com contas e evidências sintéticas. Não aponta para produção e não movimenta dinheiro. O relatório sem credenciais está em LOCAL_AUTH_VERIFICATION.json.

Validação final deste incremento: 55 testes passaram; build de produção passou; lint sem erros e com 18 avisos. Restore local completo seguido de teste Auth/PostgREST/Storage passou, incluindo download privado e cancelamento sem pagamento. Verificação visual e provedores externos continuam pendentes.
