"use server";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getResendClient } from "@/lib/resend";

const FROM = process.env.RESEND_FROM ?? "Talles Diniz <talles@oliceu.com>";
const REPLY_TO = "talles@oliceu.com";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oliceu.com";
}

export async function sendRecoveryLink(email: string) {
  const siteUrl = getSiteUrl();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: email.trim().toLowerCase(),
    options: {
      redirectTo: `${siteUrl}/reset-password`,
    },
  });

  if (error || !data) {
    return { error: "Erro ao gerar link de recuperação" };
  }

  const actionLink = (data.properties as Record<string, unknown>)?.action_link;

  if (!actionLink || typeof actionLink !== "string") {
    return { error: "Link de recuperação não gerado" };
  }

  const resend = getResendClient();

  const res = await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: "Recuperação de senha — Liceu Underground",
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="background:#0e0e0e;color:#d4d0c8;font-family:Georgia,serif;margin:0;padding:40px 24px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6860;margin-bottom:32px;">
      LICEU UNDERGROUND
    </div>

    <h1 style="font-size:24px;font-weight:400;line-height:1.4;margin:0 0 24px;">
      Redefinir sua senha
    </h1>

    <p style="font-size:15px;line-height:1.9;color:#a8a49c;margin:0 0 24px;">
      Você solicitou uma redefinição de senha. Clique no link abaixo para criar uma nova senha.
    </p>

    <p style="font-size:13px;line-height:1.7;color:#6b6860;margin:0 0 32px;">
      Este link é de uso único e expira em 24 horas. Se não foi você, ignore este email.
    </p>

    <a href="${actionLink}"
       style="display:inline-block;border:1px solid #d4d0c8;color:#d4d0c8;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;">
      Redefinir senha →
    </a>

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #2a2a2a;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#4a4844;">
      LICEU UNDERGROUND — ESCOLA DE PENSAMENTO APLICADO À FALA
    </div>
  </div>
</body>
</html>`,
  });

  if (res.error) {
    return { error: "Erro ao enviar email de recuperação" };
  }

  return { success: true };
}
