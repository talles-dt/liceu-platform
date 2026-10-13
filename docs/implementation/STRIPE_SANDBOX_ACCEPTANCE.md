# Teste financeiro Stripe — 13/10/2026

**Passou no sandbox da conta Liceu Underground (`acct_1TC9LbDLweZOOMDK`).** A autorização OAuth da CLI foi confirmada no perfil `liceu-validation`; `balance.livemode=false` foi verificado antes das mutações. A credencial de produção da Vercel não foi usada. Nenhuma variável remota, venda real ou registro acadêmico foi alterado.

## Cenários executados

- Catálogo de teste em BRL: assinatura geral R$799/mês, revisão R$199 e mentoria R$449.
- Sessões Checkout criadas para as três ofertas e expiradas após o teste de configuração.
- Assinatura iniciada com cartão de teste: estado `active`, primeira fatura `paid`, R$799.
- Relógio de teste avançado: nova fatura mensal `paid`, R$799.
- Cartão substituído por fixture que recusa cobrança: renovação seguinte deixou assinatura `past_due`, fatura `open`, valor pago zero.
- Assinatura cancelada com `invoice_now=false` e `prorate=false`; estado `canceled` confirmado por leitura posterior. A CLI pediu confirmação e depois não devolveu JSON; o roteiro foi corrigido para conferir o resultado real sem repetir cegamente a ação.
- Pagamentos avulsos simulados de R$199 e R$449: `succeeded`; reembolso integral de ambos: `succeeded`.
- Teste adicional no navegador: Checkout hospedado da revisão, explicitamente marcado “Sandbox”, preenchido com identidade sintética e cartão de teste. Redirecionamento de sucesso observado; API confirmou `complete`, `paid`, R$199. Reembolso integral confirmado.

Evidências sem credenciais: `STRIPE_SANDBOX_VERIFICATION.json` e `STRIPE_HOSTED_CHECKOUT_VERIFICATION.json`. As identidades e recursos são exclusivamente sintéticos; os IDs permitem inspeção no painel de teste. A assinatura foi cancelada e sessões incompletas expiradas. Objetos de catálogo e histórico financeiro de teste foram preservados como evidência.

## Reexecução e limites

Roteiro: `python scripts/stripe/verify-sandbox.py`. Exige CLI autenticada no perfil correto. Estado/checkpoints ficam em `.local-u00u05/stripe-sandbox-state.json` (ignorado, modo 0600). Execução já aprovada não repete mutações; uma rodada nova exige preservar/mover o estado anterior. O roteiro usa API Stripe `2024-06-20`, chaves de idempotência e relógio controlado; não é parte da CI comum porque depende de autorização externa.

**Este aceite é do provedor financeiro e do Checkout hospedado.** As chamadas de contratação/serviço foram geradas pelo roteiro, não pela sessão autenticada de um aluno. A concessão/revogação de acesso no banco do aplicativo após esses eventos ainda não foi validada ponta a ponta contra este sandbox. Os testes locais de autorização/persistência e a entrega real não financeira em produção são evidências separadas. Não marcar como validada uma renovação financeira em produção.

As vendas permanecem fechadas. O próximo teste de integração é ligar o sandbox a uma instância isolada do aplicativo e banco e percorrer aluno → contratação → webhook → acesso → inadimplência/cancelamento, além do fluxo docente → serviço → pagamento → reembolso. Não apontar os eventos de teste para o banco de produção.

Referências oficiais usadas: [cartões de teste](https://docs.stripe.com/testing) e [relógios de teste](https://docs.stripe.com/billing/testing/test-clocks/simulate-subscriptions).
