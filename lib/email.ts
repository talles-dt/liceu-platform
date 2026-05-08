import { getResendClient } from "@/lib/resend";

const FROM =
  process.env.RESEND_FROM ??
  "Talles Diniz <talles@oliceu.com>";

const REPLY_TO = "talles@oliceu.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oliceu.com";
const INSTAGRAM_URL = process.env.INSTAGRAM_URL ?? "https://instagram.com/oliceu";

/**
 * Sent when the buyer already has a Supabase account at purchase time.
 * Course is already provisioned — just point them to the dashboard.
 */
export async function sendAccessReadyEmail(email: string) {
  const resend = getResendClient();

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
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
    replyTo: REPLY_TO,
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
    replyTo: REPLY_TO,
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
    replyTo: REPLY_TO,
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
    replyTo: REPLY_TO,
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

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSIS RESULT EMAILS
// Four paths based on score. Copy by Talles Diniz.
// ─────────────────────────────────────────────────────────────────────────────

export type DiagnosisResult = "rejeicao" | "apostila" | "video" | "entrevista";

/**
 * 0–4 pontos — Rejeição sumária.
 * Sem produto. Apenas Instagram.
 */
export async function sendDiagnosisRejeicaoEmail(email: string, nome: string) {
  const resend = getResendClient();
  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: "O seu diagnóstico (Reprovado)",
    html: diagnosisHtml(nome, `
      <p style="margin:0 0 18px;">${nome}, os seus números chegaram. O resultado é um só: você reprovou no filtro do Liceu.</p>

      <p style="margin:0 0 18px;">O seu mapa indica que você ainda procura soluções de palco. Você acredita que o seu problema se resolve com oratória tradicional, com técnicas de "storytelling" ou tentando ser mais extrovertido e carismático em reuniões.</p>

      <p style="margin:0 0 18px;">Enquanto você tratar a comunicação como uma performance estética para agradar os outros, o nosso método não vai servir para você.</p>

      <p style="margin:0 0 18px;">Aqui nós não ensinamos teatro corporativo. Se eu te colocasse na nossa arena hoje, sob pressão real e interrupção, o seu ego não suportaria a carga do nosso feedback. Você levaria a crítica para o lado pessoal e o seu sistema colapsaria.</p>

      <p style="margin:0 0 18px;">O mundo te ensinou a resolver isso do jeito errado. E você ainda está apegado a essa falsa solução.</p>

      <p style="margin:0 0 18px;">Por isso, todas as portas de entrada para os materiais, videoaulas e mentorias do Liceu estão bloqueadas para você neste momento. O seu dinheiro não compra acesso à nossa estrutura se a sua cabeça não estiver no lugar certo.</p>

      <p style="margin:0 0 18px;">O seu único dever agora é observar e desintoxicar a sua mente dessa cultura da comunicação rasa.</p>

      <p style="margin:0 0 24px;">Acompanhe o conteúdo diário no nosso Instagram:</p>

      <a href="${INSTAGRAM_URL}" style="${btnStyle('muted')}">Acessar Instagram →</a>

      <p style="margin:32px 0 0;color:#6b6860;font-size:13px;line-height:1.8;">Fique em silêncio. Estude os confrontos. Veja na prática como a ordem interna destrói o carisma artificial no mundo real.</p>

      <p style="margin:16px 0 0;color:#6b6860;font-size:13px;">Quando você aceitar que a autoridade verbal não nasce da voz, mas da estrutura prévia do pensamento, você estará pronto para refazer este diagnóstico.</p>

      <p style="margin:24px 0 0;color:#6b6860;font-size:13px;">Até lá, permaneça na plateia.</p>
    `),
  });
}

/**
 * 5–9 pontos — Direcionamento para a apostila (ebook).
 */
export async function sendDiagnosisApostilaEmail(email: string, nome: string) {
  const resend = getResendClient();
  const checkoutUrl = `${SITE_URL}/api/stripe/checkout-redirect?kind=ebook`;

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: "Seu mapa de falhas (Diagnóstico do Liceu)",
    html: diagnosisHtml(nome, `
      <p style="margin:0 0 18px;">${nome}, você preencheu o diagnóstico do Liceu. O resultado está documentado.</p>

      <p style="margin:0 0 18px;">Seus números mostram um padrão perigoso: você ainda acredita que o seu problema se resolve com estética, com "falar melhor" ou tentando agradar as pessoas da sala.</p>

      <p style="margin:0 0 18px;">É por isso que a sua mente colapsa quando um superior te interrompe. Você tenta usar emoção ou volume para compensar a falta de uma estrutura lógica.</p>

      <p style="margin:0 0 18px;">Eu não aceito alunos com esse mapa mental na minha Mentoria. Sob a carga das simulações que fazemos lá dentro, o seu raciocínio seria esmagado na primeira objeção.</p>

      <p style="margin:0 0 18px;">Você não precisa de um palco agora. Você precisa de ordem interna. Antes de pensar em falar sob pressão, você precisa aprender a estruturar as suas ideias no silêncio.</p>

      <p style="margin:0 0 24px;">Seu único ponto de partida viável é a leitura da nossa base metodológica.</p>

      <a href="${checkoutUrl}" style="${btnStyle('primary')}">Acessar a Apostila Oficial do Liceu →</a>

      <p style="margin:32px 0 0;color:#a8a49c;font-size:14px;line-height:1.9;">Neste material, você vai desintoxicar a sua mente dos vícios de extroversão e entender como a ordem interna funciona no papel.</p>

      <p style="margin:16px 0 0;color:#a8a49c;font-size:14px;">A fala é efeito, nunca a causa. Conserte a causa.</p>

      <p style="margin:24px 0 0;color:#6b6860;font-size:13px;">Estou te observando,<br/>Talles</p>
    `),
  });
}

/**
 * 10–14 pontos — Direcionamento para as videoaulas.
 */
export async function sendDiagnosisVideoEmail(email: string, nome: string) {
  const resend = getResendClient();
  const checkoutUrl = `${SITE_URL}/api/stripe/checkout-redirect?kind=video`;

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: "Por que o seu cérebro apaga (Seu Diagnóstico)",
    html: diagnosisHtml(nome, `
      <p style="margin:0 0 18px;">${nome}, o diagnóstico confirmou o que você já suspeitava.</p>

      <p style="margin:0 0 18px;">Você não é tímido. Você também não é burro e nem tem problema de oratória.</p>

      <p style="margin:0 0 18px;">O seu cérebro dá um apagão em reuniões importantes por um motivo puramente mecânico: você tenta organizar as suas ideias ao mesmo tempo em que a sua boca já está aberta.</p>

      <p style="margin:0 0 18px;">Fazer isso sob observação crítica e pressão é suicídio intelectual. O seu sistema nervoso não aguenta a carga, a respiração encurta e o argumento genial que você tinha se perde.</p>

      <p style="margin:0 0 18px;">A boa notícia é que você já abandonou a ilusão de que precisa de "carisma". Você sabe que o problema é estrutural.</p>

      <p style="margin:0 0 18px;">O seu próximo passo não é a Mentoria de combate ao vivo. Você ainda precisa construir o alicerce. Você precisa da Fase de Fundação.</p>

      <a href="${checkoutUrl}" style="${btnStyle('primary')}">Acessar as Videoaulas — Fase 1: Fundação →</a>

      <p style="margin:32px 0 0;color:#a8a49c;font-size:14px;line-height:1.9;">No treinamento em vídeo, eu vou te entregar o mapa para organizar o pensamento antes da exposição. É a instalação do esqueleto do método.</p>

      <p style="margin:16px 0 0;color:#a8a49c;font-size:14px;">Quando você parar de se explicar demais e dominar a estrutura teórica, nós conversamos sobre treinar sob interrupção real.</p>

      <p style="margin:24px 0 0;color:#6b6860;font-size:13px;">Até lá,<br/>Talles</p>
    `),
  });
}

/**
 * 15–20 pontos — Direcionamento para a entrevista de qualificação (R$99).
 */
export async function sendDiagnosisEntrevistaEmail(email: string, nome: string) {
  const resend = getResendClient();
  const checkoutUrl = `${SITE_URL}/api/stripe/checkout-redirect?kind=mentoring_interview`;

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: "Aprovado no filtro teórico. Próximo passo.",
    html: diagnosisHtml(nome, `
      <p style="margin:0 0 18px;">${nome}, os seus números do diagnóstico estão na minha mesa.</p>

      <p style="margin:0 0 18px;">Você passou no crivo. O seu mapa mostra um adulto inteligente que já entendeu que autoridade não nasce da voz, nem do tom. Nasce do domínio intelectual.</p>

      <p style="margin:0 0 18px;">Você odeia os "palestrinhas" corporativos e sabe que precisa de uma ferramenta cirúrgica para calar a boca de quem tenta te encurralar no seu próprio jogo.</p>

      <p style="margin:0 0 18px;">Mas preencher um formulário no conforto da sua tela não prova nada militarmente. O papel aceita qualquer coisa. No Liceu, a técnica só é validada se suportar fadiga, observação hostil e discordância extrema.</p>

      <p style="margin:0 0 18px;">O seu problema agora é falta de carga. O seu próximo degrau é a Mentoria Armas da Palavra.</p>

      <p style="margin:0 0 24px;">Mas eu não aceito a sua entrada sem antes testar os seus disjuntores ao vivo.</p>

      <a href="${checkoutUrl}" style="${btnStyle('primary')}">Agendar a Sabatina de Qualificação — R$ 99 →</a>

      <div style="margin:32px 0;border:1px solid #2a2a2a;padding:20px;">
        <p style="margin:0 0 12px;color:#a8a49c;font-size:14px;line-height:1.9;">Para blindar o meu tempo contra teóricos de internet, essa sabatina cruzada tem um pedágio de 99 reais. Funciona assim:</p>
        <p style="margin:0 0 10px;color:#a8a49c;font-size:14px;line-height:1.9;">Nós sentamos frente a frente. Eu te coloco sob pressão. Se você suportar a carga e eu atestar que você tem fundação para a Mentoria, você está dentro. Os 99 reais são abatidos do valor final.</p>
        <p style="margin:0;color:#a8a49c;font-size:14px;line-height:1.9;">Se você engasgar, se defender demais ou colapsar tecnicamente, eu recuso a sua vaga. Os 99 reais cobrem o meu tempo descartando você.</p>
      </div>

      <p style="margin:0;color:#6b6860;font-size:13px;">O filtro para a linha de frente é letal. Agende o seu horário no link acima.</p>

      <p style="margin:24px 0 0;color:#6b6860;font-size:13px;">Te vejo no combate,<br/>Talles</p>
    `),
  });
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function btnStyle(variant: "primary" | "muted"): string {
  const base =
    "display:inline-block;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;";
  return variant === "primary"
    ? base + "border:1px solid #d4d0c8;color:#d4d0c8;"
    : base + "border:1px solid #4a4844;color:#6b6860;";
}

function diagnosisHtml(nome: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="background:#0e0e0e;color:#d4d0c8;font-family:Georgia,serif;margin:0;padding:40px 24px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b6860;margin-bottom:32px;">
      LICEU UNDERGROUND / DIAGNÓSTICO
    </div>
    <div style="font-size:15px;line-height:1.95;color:#d4d0c8;">
      ${body}
    </div>
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #2a2a2a;font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#4a4844;">
      LICEU UNDERGROUND — ESCOLA DE PENSAMENTO APLICADO À FALA
    </div>
  </div>
</body>
</html>`;
}
