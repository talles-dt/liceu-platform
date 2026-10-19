# Módulos 2–6 e seleção de materiais por edição

Entrada editorial: `content/formations/trivium/PILOTO_0.3.0.md`. Dez materiais completos e cinco manifestos editoriais; release 0.3.0 em revisão. C1 e sua referência 0.2.0 permanecem intactos.

## Contrato HTTP e compatibilidade

- `GET /api/formations/{cohortId}/materials?module=c02&kind=participant`: `module` opcional, padrão `c01`; aceita somente `c01`–`c06`. `kind` continua `participant` ou `teacher`; `download=1` devolve Markdown integral.
- A edição é sempre obtida da release fixada na coorte. Um parâmetro `release` enviado pelo cliente não troca a edição. Não há fallback para material mais recente.
- `GET /api/formations/preview/materials?module=c05&kind=teacher&release=0.3.0`: apenas administrador; allowlist de releases 0.2.0 e 0.3.0, padrão 0.3.0. Edição antiga sem módulo novo retorna 404.
- Matrícula, situação e papel continuam verificados antes de carregar material da coorte. Participantes e avaliadores não recebem guias. Falha de consulta não concede acesso.
- O registro `materials/index.json` é controlado pelo repositório: módulo → versão → papel → caminho/hash. A requisição e o manifesto da coorte nunca fornecem caminho de arquivo. Referência/hash divergente não permite fallback; arquivo alterado após geração falha na conferência.
- HTML e download são `private, no-store`. Título, nome do arquivo e link de download preservam módulo e edição. HTML sanitizado e CSP restritiva mantidos. As regras de impressão fazem tabelas caberem na largura da página e evitam partir linhas.

A tela da coorte usa a referência de material do ciclo selecionado e sua cadência. A administração oferece os seis cadernos/guias na prévia e consulta da edição antiga. Os arquivos Markdown são incluídos no tracing das duas rotas de servidor. Nenhuma migration ou modificação de conta, cobrança ou matrícula foi necessária.

## Dados e aprovação

O schema de release mantém compatibilidade: `materials` já era um mapa, agora usado para seis chaves. Validação adicional exige quatro semanas de 120–180 minutos individuais, exatamente três encontros de 90 minutos e referência de material a ciclo existente. Releases antigas sem cadência continuam legíveis.

As fontes editoriais incluem informação docente reservada, mas o gerador somente copia para a release os objetivos, prompts públicos, bibliografia, rubricas e cadência. Respostas comentadas e textos de transferência ficam nos guias, não no manifesto da coorte. C6 tem antologia de escolha de um item, explicitada no prompt, caderno e manifesto editorial.

A aprovação anterior não é propagada: a release nova é `draft`; materiais novos têm revisão pendente. O teste de publicabilidade estrutural aprova somente uma cópia em memória, para demonstrar que a bibliografia dos seis ciclos está completa. Não há publicação de release no banco nem deploy nesta etapa.

## Verificação

- 107 testes em 16 arquivos: preservação de C1, conteúdo integral incorporado, guias contendo o caderno, hashes, orçamento semanal e encontros, tarefas reservadas ausentes dos materiais públicos, escolha única de C6, seleção de edição e autorização.
- Build e TypeScript passaram. Lint dos arquivos alterados verificado separadamente.
- Testes HTTP de handlers com identidades e banco simulados; renderização real dos materiais e fontes locais. Não equivalem a um fluxo autenticado em produção.
- Impressão: os dez HTML produzidos pelo renderizador do endpoint foram exportados localmente com WeasyPrint 70.0. Cadernos C2–C6: 14, 16, 13, 18 e 35 páginas; guias: 20, 21, 18, 24 e 40. Inspeção visual das aberturas, tabela semanal de C2, rubricas de C2/C4/C6 e fechamento docente de C6: sem cortes ou sobreposição nas amostras. C6 reúne uma antologia de escolha, não uma exigência de leitura cumulativa. Isso verifica a impressão local, não todas as combinações de navegador/impressora.
- Tracing do build conferido: as duas rotas incluem os 12 materiais (C1 e C2–C6). Regeneração determinística conferida; C1 e release 0.2.0 sem alterações. Aplicar revisão editorial real antes de usar `--publication`; não alterar a coorte existente para adotar silenciosamente esta versão.
