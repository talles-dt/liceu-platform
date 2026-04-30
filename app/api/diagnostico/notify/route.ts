import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const TEMPLATES: Record<string, { subject: string; intro: string }> = {
  silencio: {
    subject: "Antes do palco, há um trabalho.",
    intro: "Seu diagnóstico revelou que você ainda não está pronto para o treinamento retórico — e isso não é um problema. É o diagnóstico correto.",
  },
  arquiteto: {
    subject: "Você constrói. Falta fazer sangrar.",
    intro: "Seu arquétipo é O Arquiteto. Lógica irrefutável, estrutura sólida — e uma sombra clara: o discurso irrefutável que ninguém lembrou amanhã.",
  },
  profeta: {
    subject: "Você revela. Agora aprenda a entregar.",
    intro: "Seu arquétipo é O Profeta. Você sabe o que dizer. O Liceu te ensina a entregar no momento certo.",
  },
  // Adicione outros arquétipos aqui conforme necessário
};

export async function POST(req: Request) {
  const { email, name, archetype_key, archetype_name, share_token } = await req.json();
  
  const tpl = TEMPLATES[archetype_key] ?? {
    subject: `Seu arquétipo retórico: ${archetype_name}`,
    intro: `Você é ${archetype_name}. O Liceu tem um caminho para você.`,
  };

  await resend.emails.send({
    from: "Liceu Underground <noreply@liceu.underground>",
    to: email,
    subject: tpl.subject,
    html: `
      <p>Olá, ${name}.</p>
      <p>${tpl.intro}</p>
      <p><a href="https://liceu.underground/checkout">Comece no Liceu →</a></p>
      <hr/>
      <p style="font-size:12px;color:#888">
        Compartilhe seu resultado:
        <a href="https://liceu.underground/diagnostico/${share_token}">ver meu arquétipo</a>
      </p>
    `,
  });

  return NextResponse.json({ ok: true });
}