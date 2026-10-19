# Administração de Formação e Mentoria

## Escopo implementado

- Visão geral separa alunos cadastrados, acesso à Formação e acesso à Mentoria. Alunos únicos, sem contar administradores; contas suspensas não entram nos totais de acesso disponível.
- Página de Formação reúne coortes, ocupação (ativa + pausada), edição curricular e os materiais/administração já existentes.
- Lista de alunos com busca e filtro por modalidade, incluindo contas sem as duas modalidades. Cadastro individual permite alterar matrículas e concessões manuais depois da criação.
- Matrícula: ativa, pausada, retirada e concluída. Pausa reserva vaga; retirada libera; reativação confere capacidade sob o mesmo bloqueio usado na matrícula. Concluída conserva consulta ao arquivo. Histórico não é apagado.
- Mentoria manual: escopo, validade UTC, concessão e revogação. Serviços pagos/concluídos continuam sendo uma fonte independente de acesso e não são cancelados por esses controles. Concessões revogadas não são ressuscitadas; uma nova concessão tem novo identificador.
- Acompanhamento usa produções distintas, versões entregues, performances e avaliações por coorte. Não infere dificuldade, tempo de estudo ou domínio por atividade recente.
- Sistema mostra consultas reais e últimos 50 eventos de auditoria; tabela vazia é diferente de indisponibilidade.
- Removidos diagnóstico “slow”, painel de quiz vazio e linhas fictícias de entregas/sessões. O gerador aleatório em `lib/admin/mock.ts` não tinha consumidores; não era a fonte dos gráficos exibidos.

## Persistência e limites

`20261019174337_admin_student_access.sql` adiciona uma função exclusiva de `service_role`, com identidade administrativa conferida no banco, conta alvo estudante/habilitada, operação atômica, estado esperado e motivo obrigatório. Cada sucesso registra responsável, valores anteriores/posteriores e motivo em `audit_logs`. Não modifica cobrança nem redefine credenciais.

A API confere origem e identidade antes de gravar. A autorização da área do aluno reconhece tanto a origem manual inicial como a nova origem administrativa. Falhas de consulta não viram zero nem uma lista parcial de alunos; leituras são paginadas.

Troca entre coortes consiste em duas ações explícitas: matricular na nova, depois retirar da anterior. Não há migração de produções entre edições. Controles de equipe docente continuam na administração da coorte. Outras concessões de conteúdo são mostradas, mas não alteradas pelos controles de Formação/Mentoria.

## Validação em 19/10/2026

- 134 testes passaram em 20 arquivos. Cobertura desta alteração: autorização/CSRF da API, erros, origem do responsável, fontes de acesso, validade e revogação, paginação e indisponibilidade de dados.
- PostgreSQL local real: `integration/admin/access.sql`, com rollback integral das fixtures. Verificou privilégios, conta alvo, matrícula/pausa/retirada, capacidade na reativação, conflito de edição, concessão/edição/revogação, isolamento entre alunos e sete registros de auditoria.
- O teste encontrou um detalhe real: o trigger legado usa o horário da transação em `updated_at`. A comparação agora inclui os campos editáveis além do timestamp, impedindo sobrescrita mesmo quando o timestamp se repete.
- TypeScript, lint dos arquivos alterados e build de produção executados.
- `integration/admin/access.mjs` prepara um fluxo HTTP autenticado com contas sintéticas exclusivamente locais. Sua execução está bloqueada antes da criação das fixtures: o Supabase local não responde no endpoint de saúde; Auth também não alcança PostgreSQL pela rede dos contêineres. Reiniciar somente os serviços locais não resolveu. Não houve teste visual/autenticado completo nem teste com contas reais.
- A migração foi aplicada apenas ao banco local. Não houve migração remota, publicação Vercel ou mudança de acesso de alunos reais nesta etapa.

## Antes da publicação

1. Restabelecer a comunicação da pilha local Supabase e executar `node integration/admin/access.mjs` (após aplicar a migração nesse banco).
2. Conferir visualmente a lista, os formulários e os estados de erro com contas sintéticas.
3. Aplicar a migração aditiva ao projeto Liceu e publicar a aplicação; conferir a leitura administrativa autenticada em produção.

## Auditoria do ambiente existente

A consulta somente leitura ao advisor remoto ainda aponta tabelas legadas sem RLS, quatro funções antigas com `search_path` mutável e proteção de senhas vazadas desligada. Não são alterações desta migração (que fixa `search_path` e restringe execução). Não alteramos políticas legadas em massa neste trabalho. A exposição efetiva depende também dos grants já existentes e requer revisão separada.

Referências de remediação: [RLS](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public), [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [senhas comprometidas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
