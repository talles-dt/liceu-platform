import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ moduleId: string }> };

type AnnotationEntry = {
  device: string;       // dispositivo retórico
  location: string;     // localização no texto
  function: string;     // função/efeito
};

/**
 * GET — returns the classical text for this module.
 * POST — submits a structured analysis.
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: text } = await supabase
    .from("module_texts")
    .select("id, title, author, content")
    .eq("module_id", moduleId)
    .maybeSingle<{ id: string; title: string; author: string | null; content: string }>();

  if (!text) {
    return NextResponse.json({ error: "No text assigned to this module" }, { status: 404 });
  }

  // Load existing submission if any
  const { data: existing } = await supabase
    .from("assignment_submissions")
    .select("id, content, status")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .eq("kind", "text_analysis")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; content: string; status: string }>();

  return NextResponse.json({
    text,
    submission: existing ?? null,
  });
}

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    annotations?: AnnotationEntry[];
    notes?: string;
  };

  if (!body.annotations || body.annotations.length === 0) {
    return NextResponse.json({ error: "annotations is required" }, { status: 400 });
  }

  // Validate each entry has the three fields
  for (const a of body.annotations) {
    if (!a.device?.trim() || !a.location?.trim() || !a.function?.trim()) {
      return NextResponse.json(
        { error: "Each annotation needs device, location, and function" },
        { status: 400 },
      );
    }
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("assignment_submissions")
    .insert({
      user_id: user.id,
      module_id: moduleId,
      kind: "text_analysis",
      content: JSON.stringify({ annotations: body.annotations, notes: body.notes ?? "" }),
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, status: data.status });
}
