# Operação de U00–U05 — incremento de 12/10/2026

Estado: candidato local em revisão, sem migração remota ou ativação de vendas.

## Entregue

- /admin/operacoes reúne eventos pendentes, conciliação de compras históricas, pedidos de exclusão e auditoria.
- Mudanças administrativas e transições de serviços geram auditoria na mesma transação, com identidade verificada no servidor. A falha do registro impede a alteração. O log novo não copia textos, email, tokens ou payloads financeiros.
- Webhooks assinados são registrados antes do processamento. Falhas ficam disponíveis para retomada; bloqueio temporário impede execução simultânea e o evento original não é sobrescrito por tentativas posteriores.
- Cal confere aluno, docente, duração contratada e pedido pago; mantém uma reserva ativa por pedido, trata reagendamento e impede regressão por cancelamento antigo.
- Conciliação legada exige comprovante pago, email do pagador, justificativa e validade explícita. A conta com o mesmo email confirmado recupera o acesso uma vez em /me. Não converte IDs por posição nem altera progresso antigo.
- /me permite corrigir o nome e solicitar exclusão. A solicitação repetida não reinicia o processo.
- O editor de lição altera a seção real de liceu_theoretical_content ou o vídeo, com validação de vínculo. Editores antigos incompatíveis retornam 410; não escrevem no modelo legado silenciosamente.
- Falhas de flashcards e de conexão ao salvar texto são visíveis.

## Exclusão e retenção

A exclusão exige revisão independente registrada em /admin/operacoes: obrigações financeiras resolvidas, avaliação dos registros compartilhados, justificativa e data de revisão da retenção. Nenhum prazo jurídico é presumido pelo software.

A execução retoma os passos: revogar acesso → inventariar/remover arquivos → retirar dados pessoais em transação → encerrar autenticação → registrar conclusão. Uma falha conserva o passo e pode ser retomada pelo administrador.

A autenticação recebe exclusão lógica do Supabase: não permite novo acesso, mas mantém identificadores necessários às referências. Textos privados e anexos são removidos; evidências publicadas recebem marca de retirada. Narrativas coletivas envolvendo o titular são retiradas somente após revisão explícita, preservando a estrutura compartilhada. O revisor deve avaliar previamente o impacto sobre os demais participantes.

**Conclusão da conta não significa anonimização integral.** Referências acadêmicas, recibos, conciliações e registros financeiros/auditoria podem permanecer vinculáveis durante a retenção justificada. O painel indica o prazo vencido; a decisão e a remoção final desses registros, além dos dados mantidos por Stripe/Cal e backups, exigem revisão específica. Não há eliminação automática ao vencer esse prazo.

## Validação

- scripts/verify-operations.py: restore da migração, ator verificado, rollback da alteração quando a auditoria falha, fila/repetição/bloqueio e grants.
- scripts/verify-operations.mjs: Auth/PostgREST/Storage/Next locais reais, conciliação, Cal, privacidade e retomada após falha ao registrar a remoção do arquivo.
- scripts/verify-local-supabase.mjs: jornada do curso e editor de seção real.
- OPERATIONS_VERIFICATION.json e BROWSER_VERIFICATION.json registram resultados e limites.
- As tabelas Auth/Storage dos testes SQL são fixtures mínimas; os testes HTTP usam Supabase local completo.

## Ainda necessário para abrir a oferta

1. Homologar Stripe/Cal em ambientes de teste externos. Não há credenciais desses ambientes configuradas localmente; nenhum teste com dinheiro foi realizado.
2. Confirmar preços dos serviços avulsos, duração/capacidade de mentoria e frequência/limites do acompanhamento da formação.
3. Completar a jornada visual docente/admin, vídeo, diagnóstico, flashcards sob falha e navegação de retorno com texto ainda não salvo.
4. Conferir conteúdo e comprovantes reais no ambiente alvo; executar backup/restore e reconciliação de schema antes de migrar.
5. Revisar os cinco alertas altos transitivos de lint. O pacote afetado não apresenta correção compatível no audit; não houve downgrade automático.
6. Aprovar bibliografia/currículo do Trivium e preparar os seis participantes. A release editorial continua rascunho.
