import { getResendClient } from "@/lib/resend";

const FROM =
  process.env.RESEND_FROM ??
  "Liceu Underground <acesso@oliceu.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Sent when the buyer already has a Supabase account at purchase time.
 * Course is already provisioned — just point them to the dashboard.
 */
export async function sendAccessReadyEmail(email: string) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Seu acesso está pronto — Liceu Underground",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="background:#0e0e0e;color:#d4d0c8;font-family:Georgia,serif;margin:0;padding:40px 24px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6860;margin-bottom:32px;">
      LICEU UNDERGROUND
    </div>

    <h1 style="font-size:24px;font-weight:400;line-height:1.4;margin:0 0 24px;">
      Acesso confirmado.
    </h1>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 16px;">
      O pagamento foi processado. Seus módulos estão disponíveis agora.
    </p>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 32px;">
      Nenhum bônus. Nenhuma promessa. Apenas método.
    </p>

    <a href="${SITE_URL}/dashboard"
       style="display:inline-block;border:1px solid #d4d0c8;color:#d4d0c8;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;">
      Acessar dashboard →
    </a>

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #2a2a2a;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#4a4844;">
      LICEU UNDERGROUND — ESCOLA DE PENSAMENTO APLICADO À FALA
    </div>
  </div>
</body>
</html>`,
  });
}

/**
 * Sent when the buyer has no account yet.
 * Contains the Supabase magic link — clicking it creates the account,
 * provisions the course, and lands them on /dashboard.
 */
export async function sendRegistrationEmail(email: string, magicLink: string) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Complete seu cadastro — Liceu Underground",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="background:#0e0e0e;color:#d4d0c8;font-family:Georgia,serif;margin:0;padding:40px 24px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6860;margin-bottom:32px;">
      LICEU UNDERGROUND
    </div>

    <h1 style="font-size:24px;font-weight:400;line-height:1.4;margin:0 0 24px;">
      Pagamento confirmado.<br/>Complete o cadastro.
    </h1>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 16px;">
      O acesso foi adquirido. Um clique abaixo cria sua conta e libera os módulos imediatamente.
    </p>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 8px;">
      Sem senha. Sem formulário. O link expira em 24 horas.
    </p>

    <p style="font-size:13px;line-height:1.7;color:#6b6860;margin:0 0 32px;">
      Se não foi você, ignore este email.
    </p>

    <a href="${magicLink}"
       style="display:inline-block;border:1px solid #d4d0c8;color:#d4d0c8;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;">
      Ativar acesso →
    </a>

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #2a2a2a;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#4a4844;">
      LICEU UNDERGROUND — ESCOLA DE PENSAMENTO APLICADO À FALA
    </div>
  </div>
</body>
</html>`,
  });
}

/**
 * Sent after the R$99 interview fee is confirmed.
 * Contains the Cal.com link to schedule the qualifying interview.
 */
export async function sendInterviewSchedulingEmail(
  email: string,
  calLink: string,
) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Agende sua entrevista — Liceu Underground",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="background:#0e0e0e;color:#d4d0c8;font-family:Georgia,serif;margin:0;padding:40px 24px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6860;margin-bottom:32px;">
      LICEU UNDERGROUND
    </div>

    <h1 style="font-size:24px;font-weight:400;line-height:1.4;margin:0 0 24px;">
      Pagamento confirmado.<br/>Agende sua entrevista.
    </h1>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 16px;">
      Sua taxa de entrevista foi processada. O próximo passo é a entrevista de qualificação — uma conversa objetiva sobre seu contexto, seus objetivos e sua capacidade de comprometimento com o método.
    </p>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 32px;">
      Escolha o horário disponível abaixo. Chegue preparado.
    </p>

    <a href="${calLink}"
       style="display:inline-block;border:1px solid #d4d0c8;color:#d4d0c8;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;">
      Agendar entrevista →
    </a>

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #2a2a2a;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#4a4844;">
      LICEU UNDERGROUND — ESCOLA DE PENSAMENTO APLICADO À FALA
    </div>
  </div>
</body>
</html>`,
  });
}

/**
 * Sent after admin approves the application.
 * Contains the Stripe checkout link for the full program (R$4.999 - R$99 credit).
 */
export async function sendMentoringApprovedEmail(
  email: string,
  checkoutUrl: string,
) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Aprovado — Complete sua inscrição — Liceu Underground",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="background:#0e0e0e;color:#d4d0c8;font-family:Georgia,serif;margin:0;padding:40px 24px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6860;margin-bottom:32px;">
      LICEU UNDERGROUND
    </div>

    <h1 style="font-size:24px;font-weight:400;line-height:1.4;margin:0 0 24px;">
      Aprovado.
    </h1>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 16px;">
      Sua entrevista foi avaliada e você foi aprovado para o programa de mentoria.
    </p>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 8px;">
      O valor da entrevista (R$99) foi creditado automaticamente no seu acesso. O link abaixo já reflete o desconto.
    </p>

    <p style="font-size:13px;line-height:1.7;color:#6b6860;margin:0 0 32px;">
      Este link é de uso único e expira em 72 horas.
    </p>

    <a href="${checkoutUrl}"
       style="display:inline-block;border:1px solid #d4d0c8;color:#d4d0c8;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;">
      Completar inscrição →
    </a>

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #2a2a2a;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#4a4844;">
      LICEU UNDERGROUND — ESCOLA DE PENSAMENTO APLICADO À FALA
    </div>
  </div>
</body>
</html>`,
  });
}

/**
 * Sent after admin rejects the application.
 * Fee is non-refundable per policy.
 */
export async function sendMentoringRejectedEmail(email: string) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Resultado da entrevista — Liceu Underground",
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="background:#0e0e0e;color:#d4d0c8;font-family:Georgia,serif;margin:0;padding:40px 24px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6860;margin-bottom:32px;">
      LICEU UNDERGROUND
    </div>

    <h1 style="font-size:24px;font-weight:400;line-height:1.4;margin:0 0 24px;">
      Resultado da entrevista.
    </h1>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 16px;">
      Após avaliação, concluímos que o programa de mentoria não é o encaixe certo para o seu momento atual.
    </p>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 32px;">
      Isso não é um julgamento sobre capacidade — é uma questão de timing e contexto. O ebook e o curso em vídeo continuam disponíveis como porta de entrada ao método.
    </p>

    <a href="${SITE_URL}/programa"
       style="display:inline-block;border:1px solid #6b6860;color:#a8a49c;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;">
      Ver programa →
    </a>

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #2a2a2a;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#4a4844;">
      LICEU UNDERGROUND — ESCOLA DE PENSAMENTO APLICADO À FALA
    </div>
  </div>
</body>
</html>`,
  });
}
