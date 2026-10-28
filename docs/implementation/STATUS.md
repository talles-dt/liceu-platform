# Estado consolidado — 27/10/2026

Este registro substitui o checkpoint antigo como ponto de entrada. Histórico preservado em [STATUS_2026-10-10_HISTORICAL.md](STATUS_2026-10-10_HISTORICAL.md). Os roadmaps definem requisitos; não são atestados de conclusão. Produção foi publicada pela branch `codex/liceu-implementation`; não presumir que main contém essas entregas.

| Pacote | Estado reconciliado | Evidência / restante |
|---|---|---|
| U00 | Base consolidada e implantada | Inventário e baseline preservados; migrações e publicação em PRODUCTION_RELEASE.md. |
| U01 | Publicado; aceite de segurança ainda parcial | Identidade/RLS/origem, senha forte, recuperação e limite persistente. Login validado em produção e confirmado pelo usuário em 27/10. Auditoria de dependências atualizada nesta rodada; verificar dívida residual no relatório. |
| U02 | Publicado; recuperação integral ainda parcial | Dados canônicos, versões, Storage privado, auditoria e exclusão retomável. Exportação da formação exercitada no ciclo completo local. Ensaio de restore anterior não cobriu todos os bytes de Storage/Auth. |
| U03 | Publicado; sandbox parcialmente aceito | Webhook externo em produção; assinatura/renovação/falha/cancelamento e acesso local testados. Checkout iniciado no navegador já documentado no checkpoint de 15/10. Sem autorização implícita para abrir vendas. |
| U04 | Publicado; matriz visual ainda parcial | Separação das áreas, destino por acesso e materiais disponíveis. Curso legado: vídeo/flashcards/falhas ainda exigem aceite específico. |
| U05 | Publicado; reembolso sandbox aceito | Solicitação/oferta/pagamentos sintéticos já realizados. Reembolsos de revisão/mentoria e repetição no aplicativo passaram em 28/10. Cal externo não homologado; não confundir com testes locais de webhook. |
| U06 | Conteúdo aprovado e publicado | C1–C6 com cadernos/guias; release 0.4.0 registrada com suplemento de entrada. Coorte real conferida nessa edição. |
| U07 | Publicado; ciclo HTTP local aprovado | Criação por nomes, professor, acessos e atividades. Seis módulos e papéis de leitura testados. Calendário real ainda vazio. |
| U08 | Publicado; ciclo HTTP local aprovado | Feedback de par/docente/auto, versões imutáveis, Codex privado, anexos e exportação testados com Auth/Storage reais locais. Não equivale a observação pedagógica real. |
| U09 | Em fechamento operacional | Ensaio completo e auditoria desta rodada; datas, participantes e rotina em PILOT_OPERATIONS_2026-10-27.md. |
| U10 | Publicações técnicas realizadas; abertura por oferta não integralmente aceita | Não há retorno ao estado “nenhum deploy”. Persistem gates operacionais/comerciais específicos. |
| U11 | Acompanhamento a iniciar/registrar | Coorte real com três participantes ativos e um professor. Não há evidência suficiente para concluir baseline, ciclos ou validação pedagógica. |

## Evidências prioritárias

- [Aceite consolidado de 27–28/10](ROADMAP_ACCEPTANCE_2026-10-28.md): resultados, correções e limites.

- [Ciclo completo local](FORMATION_CYCLE_HTTP_2026-10-27.json): Auth, PostgREST, Storage e handlers Next reais, contas sintéticas, versão curricular 0.4.0.
- [Operação do piloto](PILOT_OPERATIONS_2026-10-27.md): contrato aprovado, responsáveis e decisões ainda necessárias.
- [Login](LOGIN_SESSION_2026-10-26.md), [limites de recuperação](RECOVERY_RATE_LIMIT_2026-10-26.md).
- [Publicação curricular](ENTRY_PRODUCTION_2026-10-19.md), [administração](ADMIN_FORMATION_ACCESS_2026-10-19.md), [criação de coorte](COHORT_SETUP_USABILITY_2026-10-19.md).
- [Stripe](STRIPE_SANDBOX_ACCEPTANCE.md): ler junto dos relatórios posteriores, pois seu texto contém limites históricos.

Não converter teste sintético em avaliação de aluno, nem preencher analytics ou calendário com dados inventados. A confirmação do usuário encerra o incidente de login relatado; não prova todas as demais jornadas.
