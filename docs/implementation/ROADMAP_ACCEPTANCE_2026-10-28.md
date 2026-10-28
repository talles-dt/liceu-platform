# Aceite operacional do roadmap — 27–28/10/2026

## Reconciliado

STATUS.md agora aponta o estado por U00–U11 e preserva o checkpoint anterior em arquivo histórico. Roadmaps e registro U00–U05 remetem ao status atual. Incidente do login encerrado pela confirmação explícita do usuário em 27/10.

## Formação — execução concluída

`integration/formation/full-cycle.mjs` usa aplicação Next, Auth, PostgREST e Storage locais reais. Recusa URL Supabase remota. Passaram: destinos por acesso, seis cadernos e guias, restrição do guia docente, glossário após baseline, rascunho e recarga, conflito de revisão, privacidade de Codex, entrega, feedback de par/docente/auto, nova versão sem substituir parecer anterior, agenda ICS, participação, performance, upload/download privado e exportação geral do próprio aluno. Par só recebe a versão atribuída; intruso não recebe anexo. Resultado em FORMATION_CYCLE_HTTP_2026-10-27.json.

Navegador real local em 27/10: aluno entrou diretamente em Formações, abriu a coorte, editou composição, salvou, recarregou preservando o texto e entregou nova versão. Devolutivas exibiram os três pilares e, ao abrir a evidência do parecer docente, mostraram a versão original. Portfólio preservou versões 2/3/5 e a performance. Botão de exportação acionado; conteúdo JSON validado no teste HTTP, não por inspeção de arquivo baixado do navegador.

Os dados são sintéticos e isolados. Não há avaliação de competência real. Não confundir o ensaio local com toda a jornada homologada em produção.

## Operação real — conferência somente leitura

Coorte Fundação: release 0.4.0, draft, três participantes e um professor ativos, datas de início/fim ausentes e zero atividades agendadas. Pergunta sobre início, horários e participantes enviada ao responsável. PILOT_OPERATIONS_2026-10-27.md contém cadência aprovada e responsabilidades. Não ativamos turma nem criamos calendário fictício.

## Dependências

Audit inicial: 9 alertas (2 críticos, 3 altos, 4 moderados). Correções compatíveis atualizaram Next 16.4.0 → 16.4.3, DOMPurify 3.4.16 → 3.4.17, undici 7.30.0 → 7.30.1, fast-uri 3.1.8 → 3.1.9 e Vitest/coverage 4.1.12. Restaram dois alertas altos na cadeia OpenAI 4 → Zod 3. A busca no código encontrou apenas o construtor em lib/openai.ts, sem consumidores; não foi identificado caminho exposto dessa validação. Isso é mitigação de alcance, não correção da dependência. Atualização major do SDK deve receber verificação própria antes de ativar qualquer consumidor. Não foi aplicado `audit fix --force`.

175 testes passaram após as atualizações. Validador de publicação aceitou a release 0.4.0 com hash 3a66a63d019a7694b3a6de86d4b0ac94944564127ad6f1b8e287615a7ef95674.

## Limites que permanecem

- Datas e composição final do piloto dependem da confirmação operacional.
- Cal externo precisa de ambiente/conta de teste e evento real; simulação local não substitui esse aceite.
- Ensaio integral de restauração Auth + bytes de Storage ainda não documentado.
- Matriz visual do curso legado, falhas de rede e acessibilidade ampliada continuam separadas do ciclo da Formação.
- Teste financeiro sandbox não abre vendas reais.

## Administração — aceite HTTP local concluído em 28/10

`integration/admin/access.mjs` passou com Auth/PostgREST/Next reais: administração/CSRF, matrícula, pausa, retirada, reativação, limite de vagas, conflito de edição, concessão/edição/revogação de mentoria, preservação de serviço pago, auditoria e todas as páginas administrativas. O teste agora reconhece tanto redirect HTTP quanto redirect transmitido pelo Next, e exige a página explicativa para usuário sem acesso administrativo. Nenhuma permissão real foi alterada.

## Serviços — sandbox concluído em 28/10

Retomados os dois pedidos sintéticos do checkpoint de 15/10. Aluno solicitou cancelamento pela API real; professor e aluno foram impedidos de executar reembolso administrativo (403); administrador concluiu revisão de R$199 e mentoria de R$449. Provedor confirmou `succeeded`, banco confirmou `refunded`. Repetir a ação manteve exatamente um reembolso por pagamento. Eventos refund.created/refund.updated foram entregues ao receptor local com HTTP 200. Nenhum dinheiro real ou dado acadêmico de produção foi alterado. Evidência: STRIPE_SERVICE_ACCEPTANCE_2026-10-28.json. O transporte é CLI OAuth para o sandbox; não declarar validação do transporte normal com chave secreta.

## Docência visual e replay

Em navegador local, docente autenticou, abriu a coorte, atribuiu avaliação da composição versão 3 e publicou parecer, confirmado na interface. Seletores agora usam títulos de ciclo/atividade e versão; pessoa avaliada e presença oferecem participantes ativos, evitando professor como seleção inicial. O servidor mantém a autorização independente da UI.

Três reenvios simultâneos de evento sandbox já processado receberam 200, sem incrementar tentativas nem alterar status/período da assinatura. Assinatura do replay gerada localmente com segredo do listener, explicitamente distinto de nova entrega originada pelo provedor. Resultado em STRIPE_REPLAY_2026-10-28.json. Lint final: zero erros, 17 avisos preexistentes.
