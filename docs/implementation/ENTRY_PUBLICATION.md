# Caderno de entrada e glossário — edição curricular 0.4.0

O responsável revisou o conteúdo e autorizou a publicação nesta conversa. A aprovação própria está em `content/formations/trivium/supplements/entrada/APROVACAO.json`. O suplemento 0.1.0 contém acolhimento, caderno breve, 41 verbetes e guia docente. Não herda aprovação de um texto que ainda não existia.

A edição 0.4.0 mantém seis ciclos e fixa versão/hash do suplemento. C1 recebe novas cópias com a redistribuição aprovada: acolhimento 5, diagnóstico 45, entrada 25, P1 30, notas 5 e Codex 10 minutos. Total 120; demais semanas e encontros permanecem iguais. As releases 0.2.0 e 0.3.0 e suas cópias anteriores permanecem intactas.

## Acesso

As rotas de materiais existentes aceitam `entry=welcome|notebook|glossary|teacher`. A rota da coorte verifica identidade, matrícula/papel/situação e release fixada. O acolhimento é liberado imediatamente; caderno e glossário exigem entrega do usuário na atividade baseline da mesma coorte e release. Como alternativa, aceitam performance dessa atividade com o participante no registro, que somente o professor pode criar pelo comando já existente. Rascunho, presença, nota, entrega de outro aluno ou de outra atividade não liberam. Erros de consulta mantêm o bloqueio. O guia requer papel docente, independentemente do parâmetro `kind`.

Na administração, a prévia permite consulta dos quatro materiais. A área da coorte oferece os links em todos os ciclos e informa como registrar realização adaptada. Não existe botão de autodeclaração para contornar o diagnóstico. Não é uma prova de aprovação: basta registrar a realização, sem nota mínima.

HTML e downloads usam `private, no-store`; os links entre materiais voltam à mesma rota protegida. Os arquivos completos ficam no servidor e são conferidos por hash; o glossário não é incluído no manifesto enviado ao cliente. Fontes, créditos e conteúdo pedagógico são preservados; nenhuma anotação interna de revisão foi adicionada às cópias para alunos.

## Validação e operação

122 testes passaram, incluindo negativas de acesso, entrada por entrega, alternativa por performance, limites de coorte/release/usuário, incompatibilidade histórica, integridade e links entre materiais. Lint, build e TypeScript verificados. Os testes HTTP dos handlers simulam identidade/banco; não equivalem a um aluno autenticado em produção.

Schema de produção conferido por leitura antes da publicação. Há um administrador ativo, nenhuma coorte e nenhuma release antes desta operação. Não são necessárias migrations. Registrar a release pela função existente `formation_publish`, com o commit integral e o hash do manifesto. Não criar coorte, aluno, matrícula ou cobrança para publicar os materiais. A evidência de publicação e deployment será registrada em documento separado.

Regeneração: `node scripts/formation/build-entry.mjs` e `npx tsx scripts/formation/build-entry-release.mjs`. Se regenerar o piloto 0.3.0, executar o segundo comando depois para recompor o registro da edição 0.4.0.
