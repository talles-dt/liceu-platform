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

1. Homologar Stripe/Cal em ambientes de teste externos. As credenciais existentes foram confirmadas na Vercel em 13/10/2026; a chave Stripe de Development é live, não de teste. Verificar a configuração complementar abaixo. Nenhum teste com dinheiro foi realizado.
2. Confirmar duração/capacidade de mentoria e frequência/limites do acompanhamento da formação. Os preços dos serviços e da assinatura geral foram definidos pelo usuário; ver atualização abaixo.
3. Completar a jornada visual docente/admin, vídeo, diagnóstico, flashcards sob falha e navegação de retorno com texto ainda não salvo.
4. Conferir conteúdo e comprovantes reais no ambiente alvo; executar backup/restore e reconciliação de schema antes de migrar.
5. Revisar os cinco alertas altos transitivos de lint. O pacote afetado não apresenta correção compatível no audit; não houve downgrade automático.
6. Aprovar bibliografia/currículo do Trivium e preparar os seis participantes. A release editorial continua rascunho.

## Conferência das variáveis do projeto — 13/10/2026

Fonte: inventário autenticado da Vercel, projeto `liceu-platform` (`prj_r3KSr6zVe6Nj6EwXxqK4KxrtMSJT`), equipe `tallestonatto-5836s-projects`. A ausência no shell local não significa ausência no projeto.

- Presentes: `STRIPE_SECRET_KEY`, credenciais Supabase, `RESEND_API_KEY`, chaves de IA e Cloudflare nos ambientes Development, Preview e Production.
- `CAL_WEBHOOK_SECRET` está presente em Preview e Production; os links Cal também existem.
- A chave Stripe recuperada de Development foi classificada apenas pelo prefixo como **live**. Não foi carregada no aplicativo local nem utilizada para criar cobranças. O arquivo temporário foi removido; nenhum valor foi registrado.
- Ausentes no inventário: `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_REVIEW_PRICE_ID`, `STRIPE_MENTORING_PRICE_ID`, `STRIPE_SALES_ENABLED`, `TRIAL_HASH_SECRET`, `CRON_SECRET` e `DIAGNOSTIC_WEBHOOK_SECRET`. As três últimas atendem fluxos específicos e não são chaves dos provedores.
- Os preços legados (`STRIPE_PRICE_EBOOK`, `STRIPE_PRICE_VIDEO`, `STRIPE_PRICE_MENTORING_PROGRAM`, `STRIPE_PRICE_MENTORING_INTERVIEW`) existem, mas não equivalem automaticamente à assinatura e aos serviços novos.

Próximo passo: configurar credencial e preços Stripe de teste no escopo de homologação, confirmar o endpoint correspondente e seu segredo de assinatura, e completar as variáveis operacionais dos fluxos utilizados. Manter vendas fechadas até a aceitação. A existência das variáveis não comprova validade das credenciais, entrega de webhooks ou homologação externa. Nenhuma variável remota foi alterada nesta conferência.

## Preços definidos e cadastro Stripe

O usuário definiu revisão avulsa por R$199, sessão de mentoria por R$449 e assinatura geral por R$799/mês. Esses valores não alteram a oferta da Formação Intelectual.

Catálogo live criado pela Stripe CLI na conta verificada do Liceu, com lookup keys e chaves de idempotência para evitar duplicação. IDs e escopos efetivamente configurados constam em `STRIPE_CATALOG.json`. Os três IDs foram configurados em Production na Vercel, junto com `STRIPE_SALES_ENABLED=false`. Nenhuma assinatura, cobrança ou checkout foi criado, e nenhum deploy foi solicitado. Deployments existentes precisam de nova publicação para receber as variáveis.

Development e Preview não receberam esses IDs live: a homologação continua dependendo de credencial e catálogo de teste na conta correta. O segredo do webhook Stripe segue pendente. A duração da mentoria continua sendo definida na proposta individual pelo docente (o código exige 15–180 minutos); não foi inventada uma duração para o novo preço.

## Verificação do webhook — 13/10/2026

Após o usuário fornecer o segredo, `STRIPE_WEBHOOK_SECRET` foi salvo como variável sensível em Production. O teste subsequente não aprovou a integração em produção:

- POST sem assinatura para `https://www.oliceu.com/api/stripe/webhook`: HTTP 500, `Missing STRIPE_WEBHOOK_SECRET`. O deployment publicado ainda não recebeu a configuração nova.
- Consultas autenticadas na conta Stripe do projeto: zero webhooks tradicionais e zero destinos de eventos v2. Não foi possível vincular o segredo fornecido a um destino dessa conta ou testar entrega real.
- Nove testes de rota passaram, com dependências simuladas. Verificação adicional com o SDK Stripe real e segredo sintético local aceitou assinatura válida e rejeitou corpo adulterado e timestamp expirado. Esses resultados não comprovam assinatura ou entrega externa com o segredo fornecido.

Para concluir: identificar a origem/conta do segredo ou cadastrar o endpoint correto (cujo segredo é gerado pela Stripe), publicar a configuração junto de uma versão e schema compatíveis e então verificar uma entrega externa controlada. Não criar um endpoint que já começará entregando eventos financeiros ao deploy incompatível. Nenhuma cobrança, reenvio de evento financeiro, migração ou deploy de produção foi realizado nesta verificação.
