import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.FROM_EMAIL ?? "Liceu Underground <contato@oliceu.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oliceu.com";

export async function sendReEngagementEmail(
  studentEmail: string,
  studentName: string,
  moduleName: string,
  moduleId: string,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping re-engagement email");
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: studentEmail,
    subject: "O Liceu ainda te espera",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #e5e2e1; background: #0a0a0a; padding: 32px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Liceu Underground</h1>
        <p style="font-size: 14px; color: #89938c;">Lembrete de progresso</p>

        <div style="margin: 24px 0; padding: 20px; background: #1c1b1b; border-left: 4px solid #004D32;">
          <p style="font-size: 16px; margin: 0 0 8px 0;">
            Olá, <strong>${studentName}</strong>.
          </p>
          <p style="font-size: 16px; margin: 0; line-height: 1.8;">
            Você parou no módulo <strong>${moduleName}</strong>.<br>
            Continue de onde parou — o conhecimento te espera.
          </p>
        </div>

        <div style="margin: 32px 0; padding-top: 24px; border-top: 1px solid #404943;">
          <a href="${SITE_URL}/modules/${moduleId}"
             style="display: inline-block; background: #004D32; color: #E5E2E1; padding: 12px 24px; text-decoration: none; font-family: 'Space Grotesk', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold;">
            Continuar o Módulo
          </a>
        </div>

        <p style="font-size: 11px; color: #89938c; margin-top: 32px;">
          Liceu Underground — Escola de pensamento aplicado à fala.
        </p>
      </div>
    `,
  });
}
