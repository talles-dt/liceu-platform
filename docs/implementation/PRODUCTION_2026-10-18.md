# Produção — 18/10/2026

Código publicado: `0bf71fecc03e002dafba1df82b01c93d1773b55e`, enviado a `origin/codex/liceu-implementation`. PR #5 continua separado do deploy; não foi feito merge em `main` nesta operação.

Deployment final: `dpl_8KWrAgCDyntqrcterp8kkFhLUxjE`, READY, promovido para produção. `vercel inspect https://www.oliceu.com` resolveu esse identificador após a promoção.

URL imutável: https://liceu-platform-klb0rqy06-tallestonatto-5836s-projects.vercel.app

## Incluído

- Conta comum com áreas distintas de Formação, Mentoria e estudos legados.
- Cadastro administrativo manual com seleção de acesso e retomada idempotente.
- Infraestrutura da Formação, módulo 1, caderno e guia com textos incorporados.
- Declaração do responsável: “Pacote curricular está aprovado e revisado.” Registro de aprovação e hashes em `content/formations/trivium/drafts/c01/APROVACAO_2026-10-18.json`.

## Banco e currículo

Supabase alvo: `rymzyaxhrcusqqzllzay` (`liceu-platform`). Migration `manual_student_access` aplicada usando o SQL de `20261018025718_manual_student_access.sql`. Função `liceu_provision_student(uuid,uuid,text,uuid,text,timestamptz)` conferida no catálogo; execução concedida apenas a proprietário e `service_role`, security invoker. Nenhum aluno real ou pagamento criado.

A consulta de produção encontrou zero coortes e zero releases. Não foram criadas nesta operação. A aprovação editorial está registrada, mas `formation:validate --publication` ainda recusa exclusivamente bibliografias ausentes em C2–C6. Os materiais de C1 estão incluídos no servidor e acessíveis à administração pela prévia; não foram apresentados como currículo integral já vinculado a uma coorte. O contrato atual não admite publicar somente C1.

## Evidência

- 91 testes em 14 arquivos passaram; build/TypeScript e lint dos arquivos alterados passaram.
- Testes reais de renderização dos dois materiais, integridade, download integral e remoção de HTML executável passaram.
- Teste SQL local anterior: atomicidade, lotação, idempotência, RLS e ausência de pagamento/assinatura artificial.
- Candidato final: `/formacoes` 200; APIs de alunos e prévia docente 403 sem autenticação.
- Domínio final: `/login` 200; `/aluno/mentoria` e `/admin/students/create` encaminham para login; APIs de alunos e prévia docente 403, com erro esperado da aplicação.
- Navegador em `www.oliceu.com/formacoes`: navegação “Meus espaços”, “Formação”, “Mentoria”, “Conta e cobrança”, “Perfil e histórico”; convite para entrar e acessar a coorte.
- Consulta de logs de erro do deployment final após essas verificações: nenhum resultado.
- O cadastro completo e a visualização administrativa autenticada não foram exercitados em produção; não havia sessão autenticada disponível. HTTP 200/403 e READY não constituem esse aceite integrado.

## Incidente corrigido e retorno

O primeiro candidato apresentou erro 500 ao carregar `jsdom`/`@exodus/bytes` na prévia dos materiais. Houve promoção breve e rollback para `dpl_89F9G3p6hAHN3xXaQfT5dURJ4EgV`. A renderização dos materiais foi alterada para `sanitize-html`, com testes reais adicionais. Os candidatos corrigidos retornaram 403 esperado, sem falha de carregamento.

Rollback anterior estável: `dpl_89F9G3p6hAHN3xXaQfT5dURJ4EgV`. A migration adiciona uma função e permanece compatível com o código anterior; não reverter dados de alunos para desfazer o deploy.
