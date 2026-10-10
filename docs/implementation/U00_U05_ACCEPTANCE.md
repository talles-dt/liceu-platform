# U00–U05: registro de execução e aceite

Data: 10/10/2026. Estado: incremento implementado em revisão; **pacotes não encerrados**. Nenhuma migração remota ou cobrança executada.

## Entrega deste incremento

| Pacote | Implementação e evidência local | Trabalho restante para aceite |
| --- | --- | --- |
| U00 | Checkout original preservado, inventário e baseline versionados; consolidação na mesma branch/PR. | Revisar reconciliação completa no ambiente alvo antes de aplicar migrações. |
| U01 | Identidade e suspensão no servidor; email autenticado com destinatário próprio ou segredo de integração; limites persistentes e falha fechada; newsletter validada; endpoint de log de login manipulável aposentado; parser sem engines executáveis/aliases. | Auditoria administrativa com ator verificado e escrita transacional; resolver 5 alertas altos transitivos de lint; revisar rotinas legadas antes de habilitar. |
| U02 | Trigger de perfil Auth reconciliado, papel docente permitido sem confiar em metadados; rascunhos com revisão/conflito e versões imutáveis; quiz administrativo canônico; exportação ampliada; download privado de anexos legados com verificação de dono. | Exclusão/retificação resumível com retenção; reconciliação explícita de identidades/conteúdos antigos; demais CRUD administrativos e trilha de auditoria; ensaio de restore do ambiente alvo. |
| U03 | Lease por assinatura, estado atual no provedor, preservação do período já pago, ledger transacional de pagamentos de serviços, falhas propagadas para retry; testes simulados de fraude, falhas e replay. | Preços da assinatura geral; homologação Stripe test mode real; fila/reprocessamento durável de falhas; mapeamento explícito e claim de compras antigas. Venda permanece desativada. |
| U04 | Quiz corrigido no servidor; salvar rascunho explicitamente, conflito de duas escritas, retry de publicação; aviso de saída para links e fechamento da página; arquivo próprio preservado após expiração. | Jornada visual autenticada completa, retorno/recarga e voltar do navegador; vídeo, flashcards e diagnóstico com falhas de rede; conferir conteúdo de todos os módulos. |
| U05 | Docente vê apenas pedidos atribuídos; administrador atribui docente; revisão com rubrica vinculada à versão; entrega após expiração; cancelamento próprio; expiração do checkout antes de cancelar; reembolso recupera ID existente ou consulta o provedor antes de criar. | Preço, duração e capacidade dos serviços; testar cancelamento/reembolso com provedor real; registro integral de transições; Cal com ordenação/replay/reatribuição e uma reserva válida por pedido. |

## Evidência reproduzível

- Unitários/API: parser, limites públicos, formação e estados de cobrança; execuções registradas no status.
- PostgreSQL 16 sintético: scripts verify-database.py, verify-formation.py e verify-u00-u05.py. Verificam baseline, permissões, progresso, formação, concorrência, imutabilidade e propriedade de pagamentos/leases.
- Supabase local real (Auth, PostgREST e Storage), PostgreSQL 17: baseline e três migrações recriados do zero. Script verify-local-supabase.mjs usa quatro identidades sintéticas e APIs Next locais. Resultado em LOCAL_AUTH_VERIFICATION.json.
- O fixture de anexo legado cria um registro em profiles porque a FK histórica aponta para essa tabela; não altera a identidade canônica nem inventa um mapeamento de usuários em produção.
- As migrações históricas anteriores ao baseline **não** foram reaplicadas indiscriminadamente. A alteração PT409 na migração da formação ainda não implantada evita retries automáticos do PostgREST sobre conflitos de negócio.
- A exportação JSON inclui textos e metadados; downloads dos binários exigem autenticação. Não é um ZIP completo.
- Teste HTTP autenticado não equivale a teste visual no navegador. Teste Stripe simulado não equivale à homologação do provedor.

## Condições comerciais da formação

content/offers/formation-proposal.json registra:
- seis fundadores, R$500/mês, seis meses;
- regular proposta a R$790/mês, 12–16 pessoas, compromisso anual;
- tutoria proposta a R$1.490/mês, condicionada a demanda e capacidade;
- anual proposto à vista a R$8.400;
- horizonte formativo de 18–36 meses com renovação anual, preservando o período contratado dos fundadores.

Esses valores não substituem os preços da assinatura geral, revisão avulsa ou sessão de mentoria. Frequência, duração dos encontros, volume de correções individuais e prazo de resposta ainda precisam ser definidos antes de publicar a oferta.

## Ordem restante de execução

1. Fechar auditoria administrativa transacional e reconciliação legada sem inferir IDs.
2. Implementar solicitação e execução retomável de exclusão/retificação, com retenção explícita de registros compartilhados e financeiros.
3. Concluir recuperação de eventos de cobrança e agendamento; homologar Stripe/Cal com configurações de teste.
4. Executar a jornada visual aluno/docente/admin e testes de falhas de rede/retorno.
5. Revisar dependências e o ambiente alvo; só depois proceder aos gates de U10.

A formação continua subordinada à pedagogia: gramática, lógica e retórica integradas; currículo versionado; sem nota global, ranking ou cobrança avulsa pelo feedback curricular incluído.
