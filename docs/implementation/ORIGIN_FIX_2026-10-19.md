# Correção de origem no formulário de coorte

Reprodução em produção antes da correção, sem sessão e sem criar registros:

- POST `/api/formations`, Origin `https://www.oliceu.com`: 403 “Administração necessária” (origem aceita; autenticação exigida).
- Mesmo POST, Origin `https://oliceu.com`: 403 “Origem inválida”.
- Origem externa: 403 “Origem inválida”.

A validação compartilhada comparava apenas com NEXT_PUBLIC_SITE_URL. Agora reconhece exatamente os dois domínios HTTPS oficiais quando o endereço configurado é um deles. Não confia em Host/X-Forwarded-Host, não permite subdomínios arbitrários e continua recusando origem ausente/null, HTTP, portas diferentes e domínios externos. Em desenvolvimento ou outras instalações, mantém comparação exata.

Fonte: `c4af13d`, branch `codex/liceu-implementation`. 143 testes passaram em 22 arquivos; lint passou. Sem alteração de banco.

Publicado: `dpl_HpridWUkwvqp1DET2V342DZJJReU`, READY, promovido ao domínio principal. Testes HTTP antes e depois da promoção: pedidos dos dois domínios oficiais passam pela validação de origem e chegam à exigência de autenticação; origem externa continua rejeitada. Verificação executada sem sessão, sem criar coortes reais. O domínio principal foi inspecionado para confirmar o novo deploy.
