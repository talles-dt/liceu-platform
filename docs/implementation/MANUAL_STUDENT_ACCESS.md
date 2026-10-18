# Criação manual de aluno e escolha de acesso

Tela: `/admin/students/create`, também acessível por botão na lista de alunos.

Opções: somente cadastro; Formação; Mentoria; Formação e Mentoria. A Formação exige coorte aberta/rascunho, com capacidade conferida novamente sob bloqueio na matrícula. A Mentoria exige escopo de 20–3.000 caracteres e permite validade opcional, interpretada no fuso do dispositivo do administrador.

A Mentoria manual usa `access_grants` com tipo `mentorship`, origem `manual_student_creation`, área `mentoring`, escopo e administrador responsável. Usa escopos vazios de cursos/módulos e não libera a assinatura geral. Não cria pedido pago, pagamento, preço ou assinatura Stripe. O aluno vê a concessão identificada em sua área; revogação e vencimento removem esse acesso. Pedidos pagos independentes continuam válidos segundo sua regra própria.

## Segurança e recuperação

A API exige administrador verificado e mesma origem. As escolhas ficam em `app_metadata` da conta criada, sob controle do servidor. O identificador da solicitação também é o identificador da conta; novas tentativas consultam a mesma identidade. Não é possível usar o fluxo para assumir uma conta existente, mudar o papel de um administrador ou substituir escolhas de uma solicitação concluída.

O RPC `liceu_provision_student` é executável apenas por `service_role`, verifica novamente o administrador, a origem da criação e as opções persistidas. Perfil, matrícula e concessão são aplicados na mesma transação. Lotações ou falhas revertem os acessos dessa tentativa. A criação no Auth é uma operação separada: se houver falha posterior, a tela informa conclusão parcial e oferece retomada, sem apagar a conta e sem anunciar sucesso.

O navegador preserva somente os campos e identificador da solicitação pendente em sessionStorage para retomada após recarga. Senhas não são persistidas ali. A senha gerada é exibida somente quando criada, com respostas `private, no-store`; se a resposta se perder, usar recuperação de senha. Esta operação não envia email. Não há remoção automática de acessos já concedidos quando uma tentativa é retomada.

## Verificação e implantação

- 88 testes automatizados, incluindo admin/origem, validação, retomada, identidade de criação, erro parcial e ausência de simulação de pagamento.
- `scripts/verify-manual-student.py`: teste PostgreSQL local com transação desfeita ao final; verificou atomicidade, idempotência, limite da coorte, privilégio de execução, RLS, ausência de assinatura geral e de pedido pago.
- Migration aplicada apenas ao Supabase local para validação. Nenhum aluno real criado, nenhuma alteração remota e nenhum email enviado.
- Aplicar `20261018025718_manual_student_access.sql` no ambiente de destino antes de publicar o código. Ela adiciona o RPC, sem substituir tabelas ou políticas existentes. Sem essa migration, a tela não consegue concluir os acessos e informa cadastro parcial.
- Build/TypeScript e lint dos arquivos alterados fazem parte da verificação. A validação com Auth e navegador em ambiente remoto não foi realizada.
