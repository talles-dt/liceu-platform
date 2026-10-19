# Palavras para começar — suplemento de entrada

Concepção aprovada pelo responsável na conversa de 19/10/2026. Os textos novos estão preparados para revisão editorial; a aprovação da release 0.3.0 não foi transferida automaticamente para este suplemento.

## Materiais

- [Acolhimento — antes do diagnóstico](0.1.0/ACOLHIMENTO.md)
- [Caderno de entrada — depois do diagnóstico](0.1.0/CADERNO_DE_ENTRADA.md)
- [Glossário de consulta](0.1.0/GLOSSARIO.md)
- [Guia docente e redistribuição da carga](0.1.0/GUIA_DOCENTE.md)
- [Manifesto estruturado](0.1.0/manifest.json)

O núcleo tem oito termos e três exercícios comentados em 25 minutos; o glossário tem 41 verbetes. O acolhimento ocupa cinco minutos. A semana 1 mantém 120 minutos por redistribuição explícita das notas e do Codex, preservando diagnóstico e leitura. Não somar o plano antigo de notas ao novo.

## Incorporação na plataforma

Este incremento entrega conteúdo, não altera a aplicação ou a release já aprovada. Para adotar o suplemento, a próxima edição curricular deve fixar seu manifesto/hash e a nova distribuição da semana 1, sem criar um sétimo ciclo. Não sobrescrever a carga da release 0.3.0 já arquivada.

Separar os acessos: acolhimento antes do diagnóstico; caderno e glossário após uma entrega de baseline registrada, nunca após uma nota mínima. Conferir a entrega da pessoa e da coorte no servidor; esconder apenas um link não basta. Para baseline realizado fora da plataforma ou com adaptação, permitir registro docente explícito, com motivo, preservando a evidência. Falha na consulta não libera silenciosamente o conteúdo. O guia é exclusivo da docência. Durante a formação, oferecer consulta por termo/categoria sem expor respostas ou tarefas reservadas do professor.

O diagnóstico não é condição de merecimento ou filtro de matrícula: a sequência organiza a observação pedagógica. Quem já leu o glossário não é penalizado; o professor registra a exposição prévia.

## Fonte e manutenção

O manifesto é a fonte dos verbetes e exercícios. As introduções e o guia são mantidos no gerador `scripts/formation/build-entry.mjs`. Regenerar com `node scripts/formation/build-entry.mjs`; conferir os quatro hashes. Todos os exemplos são originais, sem citações atribuídas a clássicos. Não publicar avisos de elaboração nos materiais destinados aos alunos; manter o estado editorial neste arquivo e no manifesto.
