import {ClaimLegacy} from "@/components/OperationsForms";
import {PrivacyControls} from "@/components/PrivacyForms";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentUser,createSupabaseServerClient} from "@/lib/supabaseServer";
import {ReadingLayout} from "@/components/ReadingLayout";
export default async function HistoryPage(){
 const user=await getCurrentUser();if(!user)redirect("/login");const db=await createSupabaseServerClient();
 const results=await Promise.all([
  db.from("liceu_learner_progression").select("completed_lessons").eq("user_id",user.id).maybeSingle(),
  db.from("liceu_work_versions").select("id,content,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),
  db.from("liceu_quiz_attempts").select("id,score,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),
 ]);
 const [progress,works,attempts]=results;
 return <ReadingLayout eyebrow="LICEU / HISTÓRICO" title="Seu percurso permanece" subtitle="Suas produções e resultados, inclusive depois do encerramento da assinatura.">
 <div className="space-y-6">{results.some(r=>r.error)?<p role="alert">Não foi possível carregar todo o histórico. Tente novamente.</p>:<>
 <p>{progress.data?.completed_lessons?.length??0} lições concluídas.</p>
 <h2 className="text-2xl">Produções guardadas</h2>{works.data?.map(w=><details key={w.id} className="border p-4"><summary>{new Date(w.created_at).toLocaleString("pt-BR")}</summary><p className="whitespace-pre-wrap mt-3">{w.content}</p></details>)}
 <h2 className="text-2xl">Tentativas de quiz</h2>{attempts.data?.map(a=><p key={a.id}>{new Date(a.created_at).toLocaleDateString("pt-BR")}: {a.score}%</p>)}</>}
 <Link href="/servicos" className="block underline">Feedbacks e acompanhamentos</Link><Link href="/conta" className="block underline">Assinatura e cancelamento</Link><ClaimLegacy/><a href="/api/me/export-data" className="block underline">Exportar meus dados</a>
 <PrivacyControls/></div></ReadingLayout>;
}
