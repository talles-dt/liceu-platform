# Criação de coortes sem identificadores internos

Correção motivada pelo uso real: o administrador precisava obter UUIDs de edição, pessoa e coorte para tarefas cotidianas. A implementação anterior não oferecia um fluxo utilizável.

## Alteração

- Edição curricular escolhida pelo nome/versão, com a mais recente selecionada.
- Professor escolhido entre contas habilitadas por nome/email. A conta administrativa atual aparece como “Eu” e vem selecionada.
- Criar coorte já concede acesso docente ao professor selecionado, pela transação existente `formation_create_cohort`.
- Sucesso oferece abertura da própria coorte; a lista é atualizada.
- Concessão em coorte existente usa seleção de coorte, pessoa e papel; mostra vínculo existente e evita nova matrícula duplicada.
- Removidos os identificadores visíveis e os campos de upload de JSON/commit da tela cotidiana. A publicação curricular continua disponível à manutenção pela API existente.
- `/formacoes` direciona o administrador ao mesmo fluxo centralizado em `/admin/formations`.

## Evidência

- 139 testes em 21 arquivos passaram. Cinco testes de interação DOM cobrem seleções iniciais, envio de criação com professor próprio, concessão em coorte existente, vínculo já existente e falha/ausência de edição.
- TypeScript e lint dos arquivos alterados passaram.
- Teste transacional no PostgreSQL local com o manifesto 0.4.0 confirmou professor administrador ativo, todas as atividades e seis ciclos. Dados sintéticos revertidos por rollback.
- Prévia temporária local respondeu HTTP 200, mas a ferramenta de navegador expirou antes da inspeção visual. A rota de prévia foi removida antes do commit/publicação. Não contamos isso como teste visual concluído.
- Fonte da aplicação: `201f1e4`, enviada à branch `codex/liceu-implementation`. Nenhuma alteração de schema ou matrícula real foi necessária para esta correção.

## Publicação

Deploy `dpl_9dUhZ1LoEB2Vrh8CLpTRFqDeXerR`, fonte `201f1e4`, build remoto READY e promovido a `www.oliceu.com`. Candidato conferido antes da promoção: `/admin/formations` exige login (307) e criação sem sessão administrativa é rejeitada (403). A inspeção do domínio após promoção confirmou o novo deploy; a rota administrativa continua protegida. Não houve criação de coorte nem alteração de matrícula de usuário real durante a validação. A sessão administrativa autenticada em produção não estava disponível para conferência visual.
