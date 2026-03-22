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
 *
 * Returns a print-ready branded HTML page.
 * The browser's native print dialog (Ctrl+P / Cmd+P → Save as PDF)
 * produces a clean PDF — no server-side PDF library needed.
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

  const courseId = lesson.modules?.course_id ?? "";
  const access = await getUserAccessLevel(user.id, courseId);
  if (access === "none") return new NextResponse("Forbidden", { status: 403 });

  const moduleTitle = lesson.modules?.title ?? "Módulo";
  const moduleIndex = (lesson.modules?.order_index ?? 0) + 1;
  const lessonIndex = lesson.order_index + 1;

  // Convert markdown to basic HTML
  const bodyHtml = lesson.content
    .split("\n\n")
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("> ")) return `<blockquote>${trimmed.slice(2)}</blockquote>`;
      return `<p>${trimmed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")}</p>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${lesson.title} — Liceu Underground</title>
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
    max-width: 720px;
    margin: 0 auto;
  }

  .eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #6b6860;
    margin-bottom: 8px;
  }

  h1 {
    font-size: 24pt;
    font-weight: 400;
    line-height: 1.25;
    margin-bottom: 40px;
    padding-bottom: 16px;
    border-bottom: 1px solid #d4d0c8;
  }

  h2 {
    font-size: 16pt;
    font-weight: 400;
    margin: 36px 0 12px;
  }

  h3 {
    font-size: 13pt;
    font-weight: 600;
    margin: 28px 0 10px;
  }

  p { margin-bottom: 18px; }

  blockquote {
    border-left: 2px solid #c6a96b;
    padding-left: 20px;
    color: #4a4844;
    margin: 28px 0;
    font-style: italic;
  }

  strong { font-weight: 600; }
  em { font-style: italic; }

  .print-hint {
    margin-top: 48px;
    padding: 16px 20px;
    border: 1px solid #d4d0c8;
    background: #f9f9f7;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    color: #6b6860;
    letter-spacing: 0.1em;
  }

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

  @media print {
    .print-hint { display: none; }
    body { padding: 0; }
    @page { margin: 2cm 2.5cm; }
  }
</style>
</head>
<body>
  <div class="eyebrow">Liceu Underground — Módulo ${moduleIndex} / Lição ${lessonIndex}</div>
  <h1>${lesson.title}</h1>

  ${bodyHtml}

  <div class="print-hint">
    Para salvar como PDF: Ctrl+P (Windows) ou Cmd+P (Mac) → Salvar como PDF
  </div>

  <div class="footer">
    <span>Liceu Underground</span>
    <span>${moduleTitle}</span>
    <span>oliceu.com</span>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Opens in browser tab — user prints to PDF from there
      "Content-Disposition": `inline; filename="liceu-modulo-${moduleIndex}-licao-${lessonIndex}.html"`,
    },
  });
}
