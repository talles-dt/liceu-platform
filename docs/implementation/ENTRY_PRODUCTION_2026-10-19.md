# Publicação do caderno de entrada — 19/10/2026

Código: `0546f9d32f5b2f0a2160ebe319a429536ac3746a`, enviado a `origin/codex/liceu-implementation`, sem merge em main.

Deployment: `dpl_4nEciXbPinUwxfWqW1frCHaas59J`, READY. Candidato com variáveis de produção e sem atribuição inicial do domínio; promovido após HTTP 200 do currículo e recusas esperadas das rotas protegidas. `vercel inspect https://www.oliceu.com` confirmou o deployment final.

URL imutável: https://liceu-platform-9hm7zitqa-tallestonatto-5836s-projects.vercel.app

## Registro curricular

Projeto Supabase `rymzyaxhrcusqqzllzay` conferido antes da operação, inclusive colunas das tabelas de atividades, entregas, performances e releases; função `formation_publish` inspecionada. Consultas PostgREST dos três caminhos de verificação do diagnóstico executadas com sucesso, somente leitura. Não houve migration.

Release **0.4.0**, identificador `4adde050-c74f-487a-8bbc-e2159007c073`, publicada pela função existente sob a única conta administrativa ativa, identificada como talles, em execução da aprovação direta nesta conversa.

Hash curricular: `3a66a63d019a7694b3a6de86d4b0ac94944564127ad6f1b8e287615a7ef95674`.

Suplemento **0.1.0**, hash do manifesto: `4a586739585f681a0b68c3ddacd0af6afb546dfdd59c67cbae1bbe203e44bf23`.

Leitura posterior pelo cliente e SQL confirmou versão, hash, commit, seis ciclos e referência do suplemento. Antes: zero releases e zero coortes. Depois: uma release e zero coortes. Nenhum aluno, matrícula ou cobrança foi criado. O arquivo temporário com credenciais do projeto foi removido após a operação.

## Evidência e limites

- 122 testes em 17 arquivos, lint dos arquivos alterados e build/TypeScript passaram. Pacote real aprovado passou em `formation:validate --publication`.
- Tracing das duas rotas inclui arquivos do suplemento e todas as edições de materiais dos ciclos.
- Candidato e domínio final: currículo 200; prévia do guia 403 sem administrador; glossário da coorte 401 sem autenticação. Definições do glossário não são expostas na página pública.
- Navegador confirmou “Palavras para começar” com a apresentação dos oito termos essenciais e exercícios, antes da descrição dos seis ciclos.
- Consulta de logs de erro do deployment final: nenhum resultado.
- Caminhos positivos e negativos de entrega/performance e restrição de papel foram verificados em testes de handlers com identidade/banco simulados. As consultas de produção confirmam compatibilidade de schema/API, não aceitação autenticada de um aluno. Não havia coorte nem sessão de aluno disponível; essa jornada não foi exercitada em produção.

Rollback de aplicação: `dpl_ECfhVZVCeKgKUqtbm3jTpRmnRYHA`. A release registrada é imutável e não deve ser apagada como atalho de rollback. Se reverter a aplicação, não abrir uma coorte 0.4.0 até restaurar código compatível com o suplemento.
