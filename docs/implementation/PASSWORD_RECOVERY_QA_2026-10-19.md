# Verificação de recuperação de senha — 2026-10-19

## Resultado observado

- As páginas públicas `/forgot-password` e `/reset-password` responderam normalmente.
- O formulário real em `https://www.oliceu.com/forgot-password` foi submetido uma vez ao endereço autorizado pelo proprietário. A interface exibiu: “Link de recuperação enviado. Verifique seu email e clique no link para redefinir sua senha.”
- A confirmação da interface indica sucesso do fluxo de envio; o recebimento na caixa de entrada ainda depende de confirmação do destinatário. A chave Resend disponível permite apenas envio, não consulta de entregas.
- Nenhuma senha de conta existente foi modificada.

## Integração real de autenticação

O teste `integration/auth/recovery.mjs` executou contra o projeto Supabase do Liceu, utilizando uma conta temporária identificada por marcador exclusivo. Não enviou email para essa conta.

Verificados em 2026-10-19T23:38:24.321Z:

1. Link de recuperação redireciona para `/reset-password` no domínio de produção com sessão de recuperação.
2. A sessão permite definir uma nova senha pelo SDK público.
3. A senha antiga é recusada.
4. A nova senha autentica a mesma conta.
5. A reutilização do link é recusada.
6. A conta temporária foi removida ao concluir o teste.

Credenciais, tokens e links de recuperação não integram este registro. O arquivo temporário de variáveis de produção foi removido depois do teste.

## Comportamento e limites

O aluno recebe um link de recuperação e escolhe sua nova senha. O fluxo não envia senha pronta nem código numérico no email.

A alteração foi testada pela integração real de autenticação; não equivale à validação completa do formulário de nova senha no navegador. O recebimento do email e a experiência do destinatário ao abrir o link permanecem pendentes.

Observações anteriores ainda não corrigidas nesta etapa: mínimo de seis caracteres na interface versus política mais exigente na API alternativa; email anuncia validade de 24 horas sem verificação da configuração de expiração. Nenhuma alteração de produto ou publicação foi feita neste teste.

## Continuação da auditoria — 2026-10-20

O destinatário informou “Expired link”. Isso comprova uma falha na experiência real; o teste de autenticação anterior não validava a entrega e abertura do email. A causa exata dessa expiração não foi confirmada por logs. O Supabase documenta que verificadores de email podem consumir links de uso único: https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching.

Correções:

- Email aponta para a página do Liceu com token no fragmento, que não é enviado no GET ao servidor. A página só verifica o token após ação explícita em “Continuar recuperação”.
- Erros de links antigos oferecem nova solicitação e mensagem em português.
- Removida trava global que afetava novas visitas à página; preparação protegida por referência da instância.
- Listener global não redireciona sobre a própria página de recuperação.
- Removida afirmação de expiração em 24 horas sem evidência de configuração.

Validação: 146 testes passam, incluindo três testes de interface de recuperação. Lint dos arquivos alterados passa. Lint geral encontra erros preexistentes em artefato local não rastreado de Stripe; verificação de tipos local encontra referências geradas antigas à página de QA removida. Build remoto limpo será usado para verificar tipos da versão publicada.

Integração real em 2026-10-20T11:12:21.967Z: duas leituras GET da página não consomem token; verifyOtp com tipo recovery cria sessão; nova senha funciona, antiga falha, reutilização é recusada. Conta temporária removida. Esse teste é de API com página pública, não prova de entrega de novo email ou teste humano completo. Nenhuma senha de usuário existente foi alterada.

Ainda pendentes: confirmação da abertura do novo email pelo destinatário, harmonização da política de senha entre formulário e API alternativa, auditoria de limitação de solicitações de recuperação e de mensagens que possam revelar existência de conta. Não se declara a autenticação inteira auditada por estes testes.

### Publicação e verificação no navegador

- Código: `86e0500c2ec128ce7c2a287a9b76b5c3cd66ff06`, enviado para `origin/codex/liceu-implementation`.
- Deploy `dpl_yu8kugdQr5oiQ67urrVRS6kF42uS`: READY; `vercel inspect www.oliceu.com` confirmou esse deploy no domínio público.
- Navegador em produção: um token sintético inválido exibiu primeiro “Continuar recuperação”; após confirmação, exibiu a mensagem de link inválido e “Solicitar novo link”, que levou ao formulário correto.
- Um novo email foi solicitado uma única vez ao destinatário autorizado, pelo formulário de produção. A interface confirmou o envio. Recebimento e abertura deste novo email pelo destinatário ainda pendentes.
