# Login e persistência de sessão — 2026-10-26

Relato: aluno com email e senha retorna à tela de login. Verificações do cadastro e das políticas de leitura confirmaram perfil não suspenso e matrícula ativa acessível ao próprio aluno. O registro de última autenticação indica que houve login; não comprova a persistência do cookie no navegador do aluno. Não houve acesso à senha nem alteração de permissões desse aluno.

O fluxo anterior autenticava no navegador, ignorava falhas de sincronização do perfil e navegava mesmo sem confirmar a sessão no servidor. Não foi possível reproduzir a causa exata no dispositivo do aluno.

Correção: uma Server Action autentica e grava os cookies; sincroniza somente perfil ausente, sem substituir privilégios existentes; verifica suspensão e perfil antes de devolver o destino. Uma segunda requisição confirma que o navegador devolveu a sessão antes da navegação. Falhas ficam visíveis no formulário. A área administrativa também explica falta de acesso em vez de enviar silenciosamente para a home.

Validação local: 175 testes passaram, incluindo credenciais inválidas, papéis persistidos, perfil ausente/suspenso/indisponível e confirmação de sessão sem cookie ou com falha de serviço. Lint dos arquivos alterados sem erros. A confirmação no navegador original do aluno continua necessária para encerrar o relato específico.

Código: a28bb38, enviado a origin/codex/liceu-implementation.

Produção: deployment dpl_BZMXYpRFcNj9CXBzecaRbV76S14P READY, com aliases oliceu.com e www.oliceu.com. Em navegador real, login por email/senha com aluno descartável e matrícula ativa em coorte isolada abriu automaticamente /formacoes e mostrou a respectiva coorte. Recarregar a página manteve a sessão e a coorte disponível. Isso valida o percurso normal de aluno com acesso apenas à Formação; não reproduz o dispositivo original nem cobre OAuth.

Limpeza concluída: sessão de QA revogada globalmente; matrícula, coorte draft e usuário descartáveis removidos; arquivos temporários com credenciais excluídos. Nenhum email enviado e nenhum acesso ou senha do aluno real alterado.
