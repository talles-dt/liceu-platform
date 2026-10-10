import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertModuleAccess } from "@/lib/routeSecurity";
type Context = { params: Promise<{ moduleId: string }> };
export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { moduleId } = await params;
  const denial = await assertModuleAccess(user.id,moduleId); if (denial) return denial;
  const { data, error } = await createSupabaseAdminClient().from("liceu_quiz_questions")
    .select("id, question, options").eq("module_id",moduleId).eq("is_published",true).order("order_index");
  if (error) return NextResponse.json({ error: "Erro ao carregar quiz" }, { status: 500 });
  return NextResponse.json({ questions: (data ?? []).map(q=>({ id:q.id, prompt:q.question, options:q.options })) });
}
export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { moduleId } = await params;
  const denial = await assertModuleAccess(user.id,moduleId); if (denial) return denial;
  const body = await req.json().catch(()=>null);
  if (!body?.answers || typeof body.answers!=="object" || Array.isArray(body.answers)) return NextResponse.json({ error: "Respostas inválidas" }, { status:400 });
  const db=createSupabaseAdminClient();
  const { data:questions,error }=await db.from("liceu_quiz_questions").select("id,correct_answer").eq("module_id",moduleId).eq("is_published",true);
  if (error) return NextResponse.json({error:"Erro ao carregar quiz"},{status:500});
  if (!questions?.length) return NextResponse.json({error:"Quiz ainda não publicado"},{status:409});
  const correct=questions.filter(q=>body.answers[q.id]===q.correct_answer).length;
  const score=Math.floor(correct/questions.length*100);
  const answers=Object.fromEntries(questions.map(q=>[q.id,typeof body.answers[q.id]==="string"?body.answers[q.id].slice(0,100):null]));
  const {error:saveError}=await db.from("liceu_quiz_attempts").insert({user_id:user.id,module_id:moduleId,score,answers});
  if(saveError) return NextResponse.json({error:"Não foi possível salvar a tentativa. Tente novamente."},{status:500});
  return NextResponse.json({score,correct,total:questions.length});
}
