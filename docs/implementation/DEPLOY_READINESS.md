# Preparação do deploy — 13/10/2026

**Atualização após autorização: migrações aplicadas e candidato promovido.** Entrega real de evento não financeiro da Stripe confirmada. Vendas permanecem fechadas. A preparação abaixo foi preservada como histórico; ver `PRODUCTION_RELEASE.md` para o resultado atual.

## Candidato

- Vercel: `dpl_89F9G3p6hAHN3xXaQfT5dURJ4EgV`.
- URL: https://liceu-platform-dosycyzj3-tallestonatto-5836s-projects.vercel.app
- Criado com `--prod --skip-domain`, usando as variáveis Production, sem promover `www.oliceu.com`/`oliceu.com`.
- Código de aplicação do commit `d5cd82e`; inclui exclusões adicionais de upload em `.vercelignore`. Alterações posteriores deste incremento são testes e documentação/artefatos de operação.
- Login retorna 200. Webhook sem assinatura retorna 400. POST administrativo anônimo sem Origin retorna 403.
- `STRIPE_SALES_ENABLED=false`; endpoint Stripe próprio permanece desativado.

## Evidência executada

- 62 testes em 10 arquivos passaram. Quatro testes novos exercitam o SDK Stripe real na rota: assinatura válida, segredo de outro endpoint, corpo alterado e timestamp expirado. Persistência é simulada nesses quatro testes.
- Lint sem erros, 17 avisos existentes; typecheck, build e validação do manifesto curricular passaram. A validação permite a release editorial em rascunho e não equivale à aprovação do currículo.
- Quatro suítes SQL passaram contra o baseline e contra o schema extraído agora do Supabase `rymzyaxhrcusqqzllzay`.
- Suítes HTTP locais completas passaram com Auth, PostgREST, Storage e Next reais: ver `LOCAL_AUTH_VERIFICATION.json` e `OPERATIONS_VERIFICATION.json`. O gateway local foi recriado após falha de rede e os testes foram repetidos com sucesso.
- Backup dos dados de `public` restaurado localmente; quatro migrações aplicadas com sucesso, preservando os cinco perfis. Ensaio adicional do bundle atômico passou. Auth e Storage foram representados por fixtures mínimas nesse ensaio; **não é um teste de recuperação integral de Auth/arquivos**. Carga local usa `session_replication_role=replica`; isso não comprova todas as FKs históricas. A configuração `transaction_timeout` do dump PG17 foi omitida apenas para a restauração no contêiner PG16.
- Backup de schema e dados públicos mantido exclusivamente em `.local-u00u05/`, com modo 0600. Hashes em `DEPLOY_MANIFEST.json`; nenhum dado real ou segredo foi commitado.
- Sondagem assinada manualmente no candidato com segredo próprio do endpoint: assinatura válida alcança processamento e retorna 500; payload alterado e assinatura expirada retornam 400. Ver `DEPLOY_WEBHOOK_PROBES.json`. O banco remoto não contém a fila exigida. **Não houve entrega originada na Stripe.**
- Navegador abriu a tela de login local, mas bloqueou conexão a `127.0.0.1:54321` (`ERR_BLOCKED_BY_CLIENT`); a jornada visual autenticada não foi aprovada nesta rodada.
- `npm audit`: cinco alertas high transitivos na cadeia de lint, nenhum critical. Não existe correção compatível indicada; a sugestão automática rebaixa eslint-config-next para 14.2.35 e não foi aplicada.

## Publicação concreta, ainda não executada

1. Verificar novamente que o projeto Supabase vinculado é `rymzyaxhrcusqqzllzay`, e atualizar backup se houver novas escritas. Confirmar recuperação de Auth/Storage e janela para alteração das políticas existentes.
2. Aplicar somente `scripts/release/liceu-u00-u05.sql`, cujo hash e fontes constam no manifesto, via `supabase db query --linked --file scripts/release/liceu-u00-u05.sql`. O bundle mantém as quatro migrações numa transação, usa lock timeout e recusa instalação parcial. Não executar `supabase db push` sobre o histórico divergente. Registrar a execução no ledger operacional; o bundle não reescreve o histórico Supabase.
3. Conferir schema, permissões/RLS, bucket privado, login e leitura de dados existentes com o candidato. Repetir sondagem assinada: precisa retornar 200 e persistir uma única entrada; repetir o mesmo evento para verificar idempotência. Enquanto não passar, não promover.
4. Promover o candidato validado com `vercel promote liceu-platform-dosycyzj3-tallestonatto-5836s-projects.vercel.app`. Só então testar o domínio público, mantendo vendas fechadas.
5. Validar entrega externa controlada e, após sucesso, ativar `we_1UPy9sDLweZOOMDKrMaB3C3K` com os eventos documentados. Não reenviar evento financeiro real sem avaliar seus efeitos.
6. Homologar checkout, renovação, falha de pagamento e reembolso com credenciais **de teste da conta correta**, que ainda não estão disponíveis. A CLI salva está expirada e aponta para outra conta; não usar esse perfil nem cobrar em live para simular testes. Validar também entrega real do Cal.

Se o bundle falhar, a transação reverte. Após commit, reverter somente o frontend pode ser incompatível com as novas RLS; planejar correção progressiva ou restauração coordenada, não remoção cega das tabelas novas. Os testes externos e visuais pendentes impedem declarar “todos os testes concluídos”.
