# Publicação autorizada — 13/10/2026

O usuário autorizou aplicar o pacote de migrações em produção e promover o candidato após validar o processamento, mantendo vendas fechadas.

- Supabase confirmado: `rymzyaxhrcusqqzllzay` (Liceu), distinto do projeto Lexio.
- Backup fresco de schema e dados de `public`, `auth` e `storage`, mantido em diretório ignorado com permissões restritas. O backup inclui metadados de Storage, não os bytes dos arquivos; nenhum arquivo foi removido nesta publicação.
- Bundle validado por SHA-256 e executado via Management API em uma transação. Não houve replay do histórico divergente de migrações.
- Cinco contas Auth e cinco perfis preservados. Zero tabelas `liceu_*`/`formation_*` sem RLS. Buckets `assignment-files` e `formation-artifacts` privados.
- Evento sintético assinado no candidato retornou 200 e ficou `done`. Repetição retornou 200 mantendo uma única entrada e `attempts=1`. Corpo adulterado e timestamp expirado retornaram 400.
- Candidato `dpl_89F9G3p6hAHN3xXaQfT5dURJ4EgV` promovido. `vercel inspect https://www.oliceu.com` confirmou esse deployment. Login público retornou 200; formação respondeu após seguir redirecionamento de autenticação; webhook sem assinatura retornou 400.
- Endpoint Stripe `we_1UPy9sDLweZOOMDKrMaB3C3K` ativado, com segredo exclusivo do Liceu.
- Entrega externa real comprovada: `evt_1UPyX8DLweZOOMDKj2Q2zwwK`, tipo `product.updated`, registrado no inbox como `done`, uma tentativa; Stripe informa `pending_webhooks=0`.
- Para gerar a evidência, foi temporariamente assinado `product.updated` e acrescentado o marcador `liceu_webhook_probe=20261013-production-acceptance` ao produto `prod_VQpVhmtr5pxJew`. Preços e pagamentos não foram alterados. O evento temporário foi removido da configuração após aceitação; permaneceram somente os dez eventos de checkout/assinatura/fatura/reembolso previstos.
- Uma tentativa anterior de reenviar `product.created` histórico não foi observada no inbox e não é contada como evidência de sucesso.
- `STRIPE_SALES_ENABLED=false` confirmado na Vercel. Nenhum checkout, assinatura ou cobrança foi criado nesta publicação.

## Limites preservados

Os 62 testes e as suítes SQL/HTTP passaram na preparação. Esta publicação comprova infraestrutura de recebimento e persistência de eventos Stripe; **não comprova checkout, renovação, inadimplência e reembolso de ponta a ponta**. Esses cenários continuam dependendo de credenciais de teste da conta correta. Integração externa Cal, jornada visual autenticada e aprovação editorial do Trivium também permanecem pendentes. Não abrir vendas com base apenas neste teste.

A PR #5 continua em revisão; a promoção via CLI não fez merge. O código de aplicação publicado é o candidato documentado; commits posteriores deste incremento registram evidência e testes. Evitar publicar a branch main antiga sobre essa versão.
