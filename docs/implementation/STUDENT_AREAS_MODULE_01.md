# Áreas do aluno e módulo 1

Implementação local iniciada em 17/10/2026. Sem migração de banco ou alteração de produção.

## Comportamento

- `/dashboard` identifica separadamente matrícula ativa/concluída na Formação e pedidos de mentoria pagos/concluídos. Um único acesso abre diretamente sua área; ambos mostram escolha. `?areas=1` abre sempre a escolha. Falha de consulta não concede acesso.
- `/aluno/mentoria` apresenta somente os objetivos, sessões e devolutivas de pedidos de mentoria do próprio usuário. Solicitações, propostas e pedidos cancelados não liberam a área contratada. A assinatura geral e revisões avulsas também não concedem mentoria. Histórico de serviços concluídos permanece disponível.
- `/formacoes` e a coorte mantêm o domínio `formation_*`, independente de assinatura e compra de sessões. O caminho anterior de estudos por módulos foi preservado em `/estudos`; não foi reclassificado como Formação ou Mentoria.
- Conta/cobrança, perfil/histórico e seletor de áreas usam a mesma identidade. Links para áreas sem acesso mostram informação de ingresso, não conteúdo de outro percurso.
- O Codex existente continua privado e vinculado à coorte. Esta mudança não copia notas para mentoria nem cria compartilhamento transversal implícito.

## Módulo 1

`content/formations/trivium/releases/0.2.0.json` integra o módulo preparado ao schema real de seis ciclos, com prompts completos, rubrica específica, leituras incorporadas, carga e hashes dos materiais. C2–C6 preservam o rascunho anterior. O comando `npx tsx scripts/formation/build-c01.mjs` reproduz o pacote a partir da proposta e dos textos versionados; não publica nem altera coortes.

Na coorte que adotar essa edição, o primeiro ciclo oferece caderno, roteiro semanal e os formulários já existentes de rascunho/entrega, Codex, devolutivas, papéis, agenda e performance. Datas efetivas continuam sendo definidas pelo professor; não foram inventadas datas a partir da semana curricular.

O endpoint `/api/formations/[cohortId]/materials` verifica identidade, matrícula, papel e release da coorte; serve HTML sanitizado para leitura/impressão e Markdown para download. O guia docente exige professor ativo/concluído da própria coorte. Avaliadores convidados não recebem o guia. O texto de transferência permanece fora do caderno. Não há fallback para uma edição mais recente caso os hashes não coincidam. Respostas não são armazenadas em cache compartilhado.

A prévia `/api/formations/preview/materials` é exclusiva da administração e acessível na configuração de coortes. Ela permite revisar os materiais antes da publicação. Os arquivos são incluídos explicitamente no pacote do servidor; não são servidos em `public/`.

## Limites e adoção

As novas traduções ainda aguardam revisão humana. O pacote permanece `draft` e o validador recusa publicação mesmo quando alguém altera apenas a aprovação geral, se a revisão de tradução estiver pendente. A implementação não representa aprovação filológica nem abre matrícula. Não se alterou a release de nenhuma coorte existente.

Para a adoção: registrar revisão editorial das traduções, concluir a bibliografia dos demais ciclos exigida pelo validador atual, produzir uma versão aprovada completa, validar com `--publication`, registrar o commit editorial e publicar pela administração. Criar a coorte com a release aprovada; não sobrescrever uma release já usada. Publicação parcial de apenas C1, com C2–C6 ainda em elaboração, não é suportada pelo contrato atual de publicação e não foi disfarçada como currículo integral aprovado.

O acesso da Mentoria usa contratos de serviço efetivamente existentes (`liceu_service_orders`). Não foi criado um novo plano individual estruturado, nem reinterpretadas compras legadas sem conciliação. Pacotes que incluam os dois percursos precisam dos dois vínculos; a matrícula na Formação não simula uma sessão paga.

## Verificação

- 79 testes automatizados passaram, incluindo autorização por papel, ausência de matrícula, falha de consulta, hashes, separação do guia, encaminhamento por acesso, carga e isolamento de conteúdo.
- TypeScript e build de produção passaram. Os dois materiais constam no rastreamento de arquivos do servidor; as áreas autenticadas usam renderização dinâmica explícita.
- Lint dos arquivos novos e de autorização passou. O shell preexistente tem aviso de navegação após logout; não é falha de autorização.
- Ensaio HTTP integrado preparado em `integration/formation/student-areas.mjs`: cria somente usuários/coorte sintéticos em Supabase local, verifica encaminhamento, conteúdo, gravação, recarga, isolamento entre contas e entrega. A tentativa foi bloqueada por timeout 504 no Auth local ao criar o primeiro usuário. Portanto esses cenários não foram declarados aprovados em execução integrada.
- Sem deploy, cobrança, publicação curricular ou teste em produção nesta mudança.
