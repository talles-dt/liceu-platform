# Limite de recuperação de senha

A Server Action verifica contadores persistentes antes de gerar qualquer token ou enviar email. Usa a RPC existente `liceu_rate_limit`, com atualização atômica no banco; não exige migração.

- IP: 15 tentativas por hora; cabeçalho encaminhado só é aceito no ambiente Vercel.
- Serviço: 120 tentativas por hora.
- Email normalizado: uma tentativa por minuto e três por hora.
- IP e email ficam representados por HMAC-SHA256, usando `RECOVERY_HASH_SECRET`, exclusiva deste fluxo. Não mudar essa chave como forma de redefinir limites.
- Falhas de banco ou configuração bloqueiam o envio. Reiniciar o servidor ou usar outra instância não apaga os contadores.
- Janelas fixas começam na primeira solicitação. Tentativas bloqueadas pelos limites anteriores não chegam aos posteriores. O bloqueio por email não revoga o link já enviado.

Os testes cobrem os quatro limites, indisponibilidade, chave ausente, normalização, cabeçalhos fora da hospedagem confiável e ordem de verificação antes do envio. O teste real usa apenas uma chave descartável, testa concorrência e expiração, e remove seu próprio registro. Não envia emails nem altera contas.

A proteção não resolve enumeração de contas por outras respostas do fluxo nem substitui proteção de borda contra grandes volumes. O estado de envio no navegador continua separado da comprovação de recebimento do email.
