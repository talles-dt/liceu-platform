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

## Integração de assinatura com o aplicativo

O roteiro opt-in `npx vitest run --config integration/stripe/vitest.config.ts` conecta `stripe listen` exclusivamente ao HTTP local. As entregas têm assinatura real da Stripe. O servidor de teste chama a rota real, que usa o inbox, os handlers, as RPCs e o banco Supabase local; um aluno sintético autentica via Auth e verifica a aula via PostgREST/RLS. O resultado desta rodada está em `STRIPE_ENTITLEMENT_VERIFICATION.json`.

A CLI autenticada por OAuth substitui somente o transporte das consultas do SDK: retorna respostas reais da Stripe, na API `2024-06-20`. O handler, o banco e a verificação criptográfica não são simulados. As entregas HTTP são serializadas pelo harness; concorrência entre workers não é objeto deste ensaio. O roteiro não integra a CI comum, cria recursos novos a cada execução e cancela a assinatura de teste ao terminar. IDs sintéticos ficam no relatório; credenciais e segredo temporário não são gravados nele.

Foi encontrada uma incompatibilidade reproduzível: eventos `invoice.paid` do sandbox usam `2026-02-25.clover`, com a assinatura em `parent.subscription_details.subscription`. O handler só lia `invoice.subscription`, reconhecia o pagamento inicial pelo evento de assinatura, mas ignorava a extensão na renovação. A correção aceita os dois formatos e mantém a consulta autoritativa e a conferência de titularidade. Cinco casos de regressão cobrem referências simples/expandidas e faturas sem assinatura. O endpoint de produção continua fixado em `2024-06-20`; esta correção ainda não foi publicada em produção.

O teste confere pagamento inicial, renovação, recusa de cobrança, cancelamento, deduplicação e rejeição de assinatura adulterada. Inadimplência e cancelamento preservam o intervalo pago. Para verificar bloqueio após esse intervalo, o roteiro expira somente a assinatura sintética no banco local: o relógio da Stripe não altera o relógio do PostgreSQL. Esse último passo é uma verificação explícita de fronteira temporal, não uma passagem real de meses.

**Limites remanescentes:** contratação iniciada pela sessão do aluno no frontend e fluxo docente → serviço → pagamento → reembolso no aplicativo ainda não têm aceite integrado contra o sandbox. Os pagamentos avulsos, reembolsos e Checkout hospedado já têm evidência no provedor, separada deste ensaio de assinatura. O transporte HTTP normal do SDK com chave de sandbox não foi exercitado neste harness OAuth. Não houve teste financeiro nem alteração de ambiente em produção; as vendas permanecem fechadas.

Referências oficiais usadas: [cartões de teste](https://docs.stripe.com/testing) e [relógios de teste](https://docs.stripe.com/billing/testing/test-clocks/simulate-subscriptions).

Formato atual de fatura: [referência oficial Stripe](https://docs.stripe.com/api/invoices/object).
