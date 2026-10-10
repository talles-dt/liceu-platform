# Execução do roadmap consolidado — 10 de outubro de 2026

Estado: **implementação local em revisão; nenhuma oferta liberada por esta entrega**.
Branch: `codex/liceu-implementation`. Base de produção auditada: `6969ac8`.
A cópia de trabalho de 8 de outubro permanece preservada. `INVENTORY.json` registra os arquivos recuperados; `6f5e575` incorpora essa base, incluindo a remoção do Zernio (`d461b9c`).

## Posição no roadmap

| Pacote | Estado | Evidência e limite |
|---|---|---|
| U00 — inventário/consolidação | local_candidate | Checkout anterior preservado; inventário com hashes; roadmaps incorporados. |
| U01 — segurança | local_candidate | Identidade verificada, concessões/RLS e gabaritos protegidos na migração; testes SQL sintéticos. Persistem revisão de endpoints públicos e alertas transitivos de dependências. |
| U02 — dados/progresso | local_candidate | Baseline restaurado e migração aditiva aplicada em PostgreSQL local; conclusão e gate de 70% testados. Não equivale a restore completo do Supabase/Storage/Auth em homologação. |
| U03 — assinatura | local_candidate | Checkout, trial, portal e processamento de eventos incorporados; venda desligada por configuração. Valores e homologação Stripe pendentes. |
| U04 — experiência do curso | local_candidate | Leitura integral, vídeo, quiz de módulo, produções e histórico. Práticas antigas redirecionadas às produções `liceu_*`; APIs incompatíveis respondem 410 e preservam histórico. Faltam testes autenticados de ponta a ponta. |
| U05 — serviços | local_candidate | Solicitação, oferta e entrega incorporadas; confirmação/cancelamento legado desativados. Preço, duração, capacidade e conciliação real pendentes. |
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

- Testes unitários/API: 37 casos passaram na execução local; cobrem validação editorial, origem, identidade, conflitos, matrícula administrativa e publicação recusada do rascunho, além dos fluxos incorporados.
- PostgreSQL 16 local, dados sintéticos: baseline + duas migrações aplicam; autoelevação negada, RPC anônimo negado, gabarito negado, entitlement/70%/idempotência e ordenação de eventos testados.
- Formação no banco: sétima vaga negada, isolamento de coortes, privacidade docente/par, conflito de rascunho, retry de entrega, release/parecer imutáveis, critérios dos três pilares, performance coletiva e arquivo próprio após desligamento testados.
- Compilação de produção e TypeScript passaram durante o desenvolvimento. Build final, TypeScript e 37 testes passaram no código de `dadc2e6`; lint: zero erros e 18 avisos. Dependências: 9 alertas transitivos restantes (5 altos no encadeamento do lint e 4 moderados no parser de frontmatter); o audit não está limpo.
- Proposta pública `/formacoes/curriculo` aberta no navegador local, com seis ciclos e diagnóstico expansível. Isso **não** valida a experiência autenticada com contas Supabase reais.
- Consulta remota apenas de metadados: zero diferenças nas colunas comparadas com o snapshot de 8 de outubro. Não confundir com equivalência integral de funções, policies, buckets e configuração operacional; `SCHEMA_CHECK.json` registra os metadados da consulta.

## Pendências que bloqueiam publicação

1. Revisar concessões, policies, funções, Auth e buckets no ambiente alvo; fazer backup e ensaio de restore. As migrações não foram aplicadas remotamente.
2. Homologar login/logout/recuperação/suspensão com contas reais de teste; aluno, docente, par, avaliador e intruso; duas sessões e recarga do editor.
3. Fechar biblioteca e revisão docente. `0.1.0.json` contém um texto original de oficina em rascunho; não representa bibliografia clássica aprovada nem programa pronto para matrícula.
4. Definir início/fim da coorte, convites e operação dos seis meses. O schema mantém datas e estados, mas a gestão completa de ingresso, pausa e encerramento ainda precisa de interface e aceites.
5. Homologar upload/download privado, falhas intermediárias e reconciliação de anexos pendentes. Limite inicial: PDF/texto, 10 MB. Exportação do portfólio inclui textos e metadados, não um ZIP de binários.
6. Implementar exclusão/retificação resumível de conta, evidências, arquivos e sessões com a política de retenção aprovada. O endpoint legado destrutivo agora recusa com 503, sem apagar parcialmente. A exportação geral e a da formação ainda precisam convergir.
7. Resolver editores administrativos ainda ligados aos quizzes antigos e conferir o conteúdo publicado de todos os módulos.
8. Rever abuso/persistência dos endpoints públicos de email, diagnóstico e newsletter, logs administrativos e reengajamento legado. Não habilitar rotinas externas antes desses aceites.
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
