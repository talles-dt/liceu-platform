import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL ?? "Liceu Underground <contato@oliceu.com>";

export async function sendAssignmentFeedbackEmail(
  studentEmail: string,
  studentName: string,
  moduleName: string,
  status: "approved" | "revision" | "rejected",
  reviewerNotes?: string | null,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping assignment feedback email");
    return;
  }

  const statusLabels = {
    approved: "Aprovado ✓",
    revision: "Precisa de revisão",
    rejected: "Rejeitado — reenvie com correções",
  };

  const subject = status === "approved"
    ? "Sua produção foi aprovada"
    : status === "revision"
      ? "Sua produção precisa de ajustes"
      : "Sua produção foi devolvida";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: studentEmail,
    subject,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #e5e2e1; background: #0a0a0a; padding: 32px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Liceu Underground</h1>
        <p style="font-size: 14px; color: #89938c;">Feedback de Produção</p>

        <div style="margin: 24px 0; padding: 20px; background: #1c1b1b; border-left: 4px solid ${status === "approved" ? "#004D32" : status === "revision" ? "#B5A642" : "#D32F2F"};">
          <p style="font-size: 14px; margin: 0 0 8px 0;">Olá, <strong>${studentName}</strong>.</p>
          <p style="font-size: 16px; margin: 0;">
            Sua produção no módulo <strong>${moduleName}</strong> foi revisada.
          </p>
          <p style="font-size: 18px; margin: 16px 0 0 0; font-weight: bold; color: ${status === "approved" ? "#93d5b0" : status === "revision" ? "#d8c860" : "#D32F2F"};">
            Status: ${statusLabels[status]}
          </p>
        </div>

        ${reviewerNotes ? `
          <div style="margin: 24px 0; padding: 20px; background: #131313; border: 1px solid #404943;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #89938c; margin: 0 0 8px 0;">Anotações do Revisor</p>
            <p style="font-size: 14px; line-height: 1.8; margin: 0; white-space: pre-wrap;">${reviewerNotes}</p>
          </div>
        ` : `
          <p style="font-size: 14px; color: #89938c;">Nenhuma anotação adicional foi deixada.</p>
        `}

        <div style="margin: 32px 0; padding-top: 24px; border-top: 1px solid #404943;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oliceu.com"}/dashboard"
             style="display: inline-block; background: #004D32; color: #E5E2E1; padding: 12px 24px; text-decoration: none; font-family: 'Space Grotesk', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold;">
            Acessar o Dashboard
          </a>
        </div>

        <p style="font-size: 11px; color: #89938c; margin-top: 32px;">
          Liceu Underground — Escola de pensamento aplicado à fala.
        </p>
      </div>
    `,
  });
}
