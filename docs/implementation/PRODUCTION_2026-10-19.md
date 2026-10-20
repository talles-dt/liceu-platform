# Produção — 19/10/2026 — currículo 0.3.0

Código publicado: `39e5c932958546940314b550f0e25edc3c9b1ff7`, enviado a `origin/codex/liceu-implementation`. Inclui os módulos 2–6 do commit `d1ed705` e as cópias limpas dos seis módulos. Não houve merge em main.

Deployment: `dpl_ECfhVZVCeKgKUqtbm3jTpRmnRYHA`, READY, criado com ambiente de produção sem atribuição inicial do domínio; promovido após as verificações do candidato. `vercel inspect https://www.oliceu.com` confirmou esse identificador depois da promoção.

URL imutável: https://liceu-platform-i16ezm97q-tallestonatto-5836s-projects.vercel.app

## Evidência

- 108 testes em 16 arquivos passaram; lint dos arquivos alterados, build e TypeScript passaram. Validação real `--publication` aceitou os seis ciclos e sua aprovação.
- Regeneração idêntica dos artefatos. Tracing de ambas as rotas de materiais inclui 14 arquivos: doze materiais atuais e dois históricos de C1.
- Candidato: currículo HTTP 200 com os cinco novos módulos; ausência do antigo aviso de revisão pendente e do enunciado de baseline. APIs de materiais de C1/participante e C6/professor responderam 403 esperado sem sessão autenticada.
- Domínio final: mesmas verificações HTTP passaram. Navegador em `/formacoes/curriculo` mostrou os seis módulos e seus objetivos, com apresentação limpa e aviso sobre futura abertura da coorte.
- Consulta de logs de erro do deployment nos dez minutos anteriores: nenhum resultado.

## Limites e retorno

A limpeza dos doze materiais foi verificada por testes com leitura/renderização reais dos arquivos. Não havia sessão administrativa autenticada disponível para abrir os cadernos e guias pelo site em produção; os testes de autorização dos handlers usam identidade simulada. Não apresentar isso como aceite autenticado completo.

Nenhuma mutation no banco, matrícula, cobrança ou criação de coorte. O pacote aprovado e seus materiais estão incluídos na aplicação; registrar uma release no banco e vincular uma coorte são operações distintas, não executadas aqui. Edições históricas permanecem disponíveis apenas quando explicitamente solicitadas; nenhuma coorte existente foi migrada.

Rollback anterior: `dpl_8KWrAgCDyntqrcterp8kkFhLUxjE`. Não há migration ou alteração de dados a reverter.
