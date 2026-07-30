import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = {
  params: Promise<{
    moduleId: string;
    lessonId: string;
  }>;
};

export async function POST(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { moduleId, lessonId } = await params;
  const request = _request;
  const supabase = await createSupabaseServerClient();

  // Verify the lesson belongs to the module
  const { data: lesson } = await supabase
    .from("liceu_lessons")
    .select("id, module_id")
    .eq("id", lessonId)
    .eq("module_id", moduleId)
    .maybeSingle<{ id: string; module_id: string }>();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found in this module" }, { status: 404 });
  }

  // Mark lesson as complete
  const { data: prog } = await supabase
    .from("liceu_learner_progression")
    .select("completed_lessons")
    .eq("user_id", user.id)
    .maybeSingle<{ completed_lessons?: string[] }>();

  const currentCompleted = new Set((prog?.completed_lessons ?? []) as string[]);
  if (!currentCompleted.has(lessonId)) {
    currentCompleted.add(lessonId);
  }

  const completedLessons = Array.from(currentCompleted);

  const { error } = await supabase
    .from("liceu_learner_progression")
    .upsert(
      {
        user_id: user.id,
        completed_lessons: completedLessons,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const isFormSubmission = !(request.headers.get("content-type") || "").includes("application/json");

  if (isFormSubmission) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Licao concluida</title>
  <style>
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: #1a1f2e;
      color: #e6ecf5;
      margin: 0;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      border: 1px solid #2a3347;
      background: rgba(30,37,55,0.92);
      padding: 24px;
      max-width: 420px;
      width: 100%;
    }
    h1 {
      font-size: 18px;
      margin: 0 0 12px;
    }
    p {
      font-size: 14px;
      color: #b6c0d6;
      margin: 0 0 16px;
    }
    a {
      color: #f0c36d;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Licao concluida</h1>
    <p>A lição foi marcada como concluída.</p>
    <a href="${(request.headers.get("referer") || "/").replace(/"/g, "%22")}">Voltar</a>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  return NextResponse.json({ success: true, lessonId, completed: completedLessons.length });
}
