import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getUserAccessLevel } from "@/lib/access";

type Context = { params: Promise<{ lessonId: string }> };

type DbLesson = {
  id: string;
  title: string;
  content: string | null;
  order_index: number;
  module_id: string;
  modules: { title: string; order_index: number; course_id: string } | null;
};

/**
 * GET /api/lessons/[lessonId]/download
 * Generates a branded PDF of the lesson content for offline reading.
 * Uses HTML → PDF via @sparticuz/chromium (runs in Next.js serverless).
 * Falls back to a plain-text response if PDF generation fails.
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { lessonId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, content, order_index, module_id, modules(title, order_index, course_id)")
    .eq("id", lessonId)
    .maybeSingle<DbLesson>();

  if (!lesson) return new NextResponse("Not found", { status: 404 });
  if (!lesson.content) return new NextResponse("No content", { status: 404 });

  // Access check
  const courseId = lesson.modules?.course_id ?? "";
  const access = await getUserAccessLevel(user.id, courseId);
  if (access === "none") return new NextResponse("Forbidden", { status: 403 });

  const moduleTitle = lesson.modules?.title ?? "Módulo";
  const moduleIndex = (lesson.modules?.order_index ?? 0) + 1;
  const lessonIndex = lesson.order_index + 1;

  // Convert markdown to basic HTML paragraphs
  const bodyHtml = lesson.content
    .split("\n\n")
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("> ")) return `<blockquote>${trimmed.slice(2)}</blockquote>`;
      return `<p>${trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>")}</p>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 13pt;
    line-height: 1.9;
    color: #1a1a1a;
    background: #fff;
    padding: 60px 72px;
    max-width: 680px;
    margin: 0 auto;
  }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #6b6860;
    margin-bottom: 6px;
  }
  h1 {
    font-size: 22pt;
    font-weight: 400;
    line-height: 1.3;
    margin-bottom: 40px;
    padding-bottom: 16px;
    border-bottom: 1px solid #d4d0c8;
  }
  h2 {
    font-size: 15pt;
    font-weight: 400;
    margin: 32px 0 12px;
  }
  h3 {
    font-size: 13pt;
    font-weight: 600;
    margin: 24px 0 8px;
  }
  p { margin-bottom: 16px; }
  blockquote {
    border-left: 2px solid #c6a96b;
    padding-left: 18px;
    color: #4a4844;
    margin: 24px 0;
  }
  strong { font-weight: 600; }
  em { font-style: italic; }
  .footer {
    margin-top: 60px;
    padding-top: 16px;
    border-top: 1px solid #d4d0c8;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #a1a1a1;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="eyebrow">Liceu Underground — Módulo ${moduleIndex} / Lição ${lessonIndex}</div>
  <h1>${lesson.title}</h1>
  ${bodyHtml}
  <div class="footer">
    <span>Liceu Underground</span>
    <span>${moduleTitle}</span>
  </div>
</body>
</html>`;

  // Try to generate PDF with puppeteer-core / @sparticuz/chromium
  // If not available (local dev), return the HTML directly
  try {
    const chromium = await import("@sparticuz/chromium").then((m) => m.default).catch(() => null);
    const puppeteer = await import("puppeteer-core").then((m) => m.default).catch(() => null);

    if (!chromium || !puppeteer) throw new Error("PDF generation not available");

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    const filename = `liceu-modulo-${moduleIndex}-licao-${lessonIndex}.pdf`;
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    // Fallback: serve as HTML (browser can print to PDF)
    const filename = `liceu-modulo-${moduleIndex}-licao-${lessonIndex}.html`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }
}
