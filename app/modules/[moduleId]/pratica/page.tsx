import {redirect} from "next/navigation";
import Link from "next/link";
import {getCurrentUser,createSupabaseServerClient} from "@/lib/supabaseServer";
import {canAccessLiceuModuleForUser} from "@/lib/progression";
import {WorkEditor} from "@/components/WorkEditor";
export default async function Practice({params}:{params:Promise<{moduleId:string}>}){
 const {moduleId}=await params;const user=await getCurrentUser();if(!user)redirect("/login");
 if(!await canAccessLiceuModuleForUser(user.id,moduleId))redirect("/conta");
 const db=await createSupabaseServerClient();
 const {data:lessons,error}=await db.from("liceu_lessons").select("id,title").eq("module_id",moduleId).eq("is_published",true).order("order_index");
 if(error)throw Error("Não foi possível recuperar as práticas");
 const ids=(lessons??[]).map(l=>l.id);
 const {data:exercises,error:exerciseError}=ids.length?await db.from("liceu_exercises").select("id,title,prompt_markdown,lesson_id").in("lesson_id",ids).eq("is_published",true):{data:[],error:null};
 const {data:drafts,error:draftError}=await db.from("liceu_work_drafts").select("exercise_id,content").eq("user_id",user.id);
 if(exerciseError||draftError)throw Error("Não foi possível recuperar seus textos");
 return <div className="max-w-4xl mx-auto p-8 space-y-8"><Link href={`/modules/${moduleId}`} className="underline">Voltar ao módulo</Link><h1 className="text-3xl">Práticas e produções</h1><p>Salve um rascunho ou registre uma versão. A revisão humana é um serviço separado e não bloqueia o avanço no curso.</p>{!exercises?.length&&<p>As propostas de prática deste módulo ainda estão em preparação.</p>}{exercises?.map(e=><section className="border p-5 space-y-4" key={e.id}><h2 className="text-xl">{e.title}</h2><p className="whitespace-pre-wrap">{e.prompt_markdown}</p><WorkEditor exerciseId={e.id} initialContent={drafts?.find(d=>d.exercise_id===e.id)?.content??""}/></section>)}</div>;
}
