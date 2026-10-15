import {authorizeEmail,publicLimit,validEmail} from "@/lib/publicRequests";
import { getResendClient } from "@/lib/resend";
import { NextResponse } from "next/server";
import { escapeHtml } from "@/lib/routeSecurity";





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
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    archetype_key?: string;
    archetype_name?: string;
    share_token?: string;
  };
  const { email, name, archetype_key, archetype_name, share_token } = body??{};

  if (!validEmail(email) || [name,archetype_key,archetype_name,share_token].some(value=>value!==undefined&&(typeof value!=="string"||value.length>200))) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const denied=await authorizeEmail(req,email);if(denied)return denied;
  const limited=await publicLimit(req,"diagnostic-notify",email);if(limited)return limited;

  const safeName = escapeHtml((name ?? "Visitante").slice(0, 120));
  const safeArchetypeName = escapeHtml((archetype_name ?? "resultado").slice(0, 120));
  const safeShareToken = encodeURIComponent((share_token ?? "").slice(0, 200));
  const templateKey = archetype_key ?? "";
  
  const tpl = TEMPLATES[templateKey] ?? {
    subject: `Seu arquétipo retórico: ${safeArchetypeName}`,
    intro: `Você é ${safeArchetypeName}. O Liceu tem um caminho para você.`,
  };

  await getResendClient().emails.send({
    from: "Liceu Underground <talles@oliceu.com>",
    to: normalizedEmail,
    subject: tpl.subject,
    html: `
      <p>Olá, ${safeName}.</p>
      <p>${tpl.intro}</p>
      <p><a href="https://oliceu.com/conta">Comece no Liceu →</a></p>
      <hr/>
      <p style="font-size:12px;color:#888">
        Compartilhe seu resultado:
        <a href="https://oliceu.com/diagnostico/${safeShareToken}">ver meu arquétipo</a>
      </p>
    `,
  });

  return NextResponse.json({ ok: true });
}
