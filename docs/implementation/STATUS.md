# Execução — Liceu Underground

Base: 6969ac8; remoção Zernio: d461b9c. Branch codex/liceu-subscriptions-cleanup.

Decisões: assinatura mensal; teste 14 dias com cartão; 70% no quiz e todas as lições para avançar; revisão humana paga separadamente; mentoria seletiva por sessão; sem IA no lançamento; histórico próprio acessível após expiração. IP limita velocidade, nunca identifica uma pessoa. Preços reais dependem de configuração explícita.

## Etapas
- Em execução: R0 segurança, identidade, navegação única, remoção de snapshots redundantes, CI.
- Pendente: R1 reconciliação do schema e progresso atômico.
- Pendente: R2 assinatura, eventos Stripe e proteção do trial.
- Pendente: R3 jornada completa do aluno.
- Pendente: R4 revisão/mentoria.
- Pendente: R5 verificação integrada e publicação.

## Cleanup
Cabeçalho público compartilhado; barra contextual no painel/admin; um landmark main por página. Removidos os ZIPs antigos, mockups exportados do Stitch e configuração Next duplicada; versões anteriores continuam recuperáveis no Git. Nenhum arquivo de sources/ alterado.

## Limites de publicação
Nenhuma migração remota nem deploy executados nesta etapa. Conferir schema real, backup, preços e credenciais antes de ativar cobrança.
