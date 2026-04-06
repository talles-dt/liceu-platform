import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ moduleId: string }> };

/**
 * GET — returns the prompt for this module + the user's latest submission.
 * POST — submits the main rhetorical exercise. Accepts text content and/or a file upload.
 *        Files are stored in Supabase Storage bucket "assignment-files".
 *        This is the one that gates module completion.
 */
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: assignmentRow }, { data: submissionRow }] = await Promise.all([
    supabase
      .from("module_assignments")
      .select("assignment_prompt")
      .eq("module_id", moduleId)
      .maybeSingle(),
    supabase
      .from("assignment_submissions")
      .select("id, content, status, created_at, file_url")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .eq("kind", "assignment")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    prompt: assignmentRow?.assignment_prompt ?? null,
    submission: submissionRow ?? null,
  });
}

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId } = await params;
  const contentType = req.headers.get("content-type") ?? "";

  let textContent = "";
  let fileBuffer: ArrayBuffer | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    // Parse FormData
    const formData = await req.formData();
    textContent = formData.get("content")?.toString() ?? "";
    const file = formData.get("file") as File | null;
    if (file) {
      fileBuffer = await file.arrayBuffer();
      fileName = file.name;
      fileType = file.type;
    }
  } else {
    // Parse JSON (legacy compatibility)
    const body = (await req.json().catch(() => ({}))) as { content?: string };
    textContent = body.content ?? "";
  }

  // Validate: need either text or file
  if (!textContent.trim() && !fileBuffer) {
    return NextResponse.json({ error: "Envie um texto ou um arquivo." }, { status: 400 });
  }

  if (textContent.trim() && textContent.trim().length < 50) {
    return NextResponse.json({ error: "Mínimo de 50 caracteres no texto." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Upload file to Supabase Storage if provided
  let fileUrl: string | null = null;
  if (fileBuffer && fileName) {
    const ext = fileName.split(".").pop() ?? "bin";
    const path = `${user.id}/${moduleId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("assignment-files")
      .upload(path, fileBuffer, {
        contentType: fileType ?? "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[assignment] file upload failed", uploadError);
      return NextResponse.json({ error: "Erro ao enviar arquivo." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("assignment-files")
      .getPublicUrl(path);

    fileUrl = urlData.publicUrl;
  }

  // Save submission
  const { data, error } = await supabase
    .from("assignment_submissions")
    .insert({
      user_id: user.id,
      module_id: moduleId,
      kind: "assignment",
      content: textContent,
      file_url: fileUrl,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    console.error("[assignment] db insert failed", error);
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, status: data.status });
}
