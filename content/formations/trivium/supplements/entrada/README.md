# Palavras para começar — suplemento de entrada

Textos revisados e aprovados pelo responsável em 19/10/2026: “Revisado. publique.” Registro próprio em `APROVACAO.json`. Suplemento incorporado à edição curricular 0.4.0.

## Materiais

- [Acolhimento — antes do diagnóstico](0.1.0/ACOLHIMENTO.md)
- [Caderno de entrada — depois do diagnóstico](0.1.0/CADERNO_DE_ENTRADA.md)
- [Glossário de consulta](0.1.0/GLOSSARIO.md)
- [Guia docente e redistribuição da carga](0.1.0/GUIA_DOCENTE.md)
- [Manifesto estruturado](0.1.0/manifest.json)

O núcleo tem oito termos e três exercícios comentados em 25 minutos; o glossário tem 41 verbetes. O acolhimento ocupa cinco minutos. A semana 1 mantém 120 minutos por redistribuição explícita das notas e do Codex, preservando diagnóstico e leitura. Não somar o plano antigo de notas ao novo.

## Incorporação na plataforma

A release 0.4.0 fixa o manifesto/hash do suplemento e a nova distribuição da semana 1. O módulo 1 recebe caderno e guia 0.4.0, com a carga atualizada. Permanecem seis ciclos e a release 0.3.0 não é sobrescrita.

Separar os acessos: acolhimento antes do diagnóstico; caderno e glossário após uma entrega de baseline registrada, nunca após uma nota mínima. Conferir a entrega da pessoa e da coorte no servidor; esconder apenas um link não basta. Para baseline realizado fora da plataforma ou com adaptação, permitir registro docente explícito, com motivo, preservando a evidência. Falha na consulta não libera silenciosamente o conteúdo. O guia é exclusivo da docência. Durante a formação, oferecer consulta por termo/categoria sem expor respostas ou tarefas reservadas do professor.

O diagnóstico não é condição de merecimento ou filtro de matrícula: a sequência organiza a observação pedagógica. Quem já leu o glossário não é penalizado; o professor registra a exposição prévia.

## Fonte e manutenção

O manifesto é a fonte dos verbetes e exercícios. As introduções e o guia são mantidos no gerador `scripts/formation/build-entry.mjs`. Regenerar com `node scripts/formation/build-entry.mjs`, seguido de `npx tsx scripts/formation/build-entry-release.mjs`; conferir os quatro hashes e a release 0.4.0. Todos os exemplos são originais, sem citações atribuídas a clássicos. Não publicar avisos de elaboração nos materiais destinados aos alunos; manter o estado editorial neste arquivo e no manifesto.
