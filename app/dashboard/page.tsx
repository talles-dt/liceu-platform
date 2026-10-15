import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentUser,createSupabaseServerClient} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {DashboardShell} from "@/components/DashboardShell";
export default async function DashboardPage(){
 const user=await getCurrentUser();if(!user)redirect("/login");
 const db=await createSupabaseServerClient();const admin=createSupabaseAdminClient();
 const [moduleResult,lessonResult,progressResult,completionResult]=await Promise.all([
  db.from("liceu_modules").select("id,title,subtitle,order_index").eq("is_active",true).order("order_index"),
  // Catalog metadata only. Lesson content always uses the gated learner client.
  admin.from("liceu_lessons").select("id,module_id,title,order_index").eq("is_published",true).order("order_index"),
  db.from("liceu_learner_progression").select("completed_lessons,current_lesson_id").eq("user_id",user.id).maybeSingle(),
  db.from("liceu_module_completions").select("module_id").eq("user_id",user.id),
 ]);
 const failed=[moduleResult,lessonResult,progressResult,completionResult].some(r=>r.error);
 const done=new Set<string>(progressResult.data?.completed_lessons??[]);
 const completed=new Set((completionResult.data??[]).map(c=>c.module_id));
 const modules=await Promise.all((moduleResult.data??[]).map(async m=>{const {data,error}=await db.rpc("liceu_can_access_module",{p_module_id:m.id});return{...m,accessible:!error&&data===true,lessons:(lessonResult.data??[]).filter(l=>l.module_id===m.id)};}));
 const current=modules.find(m=>m.accessible&&!completed.has(m.id));
 const nextLesson=current?.lessons.find(l=>!done.has(l.id));
 return <DashboardShell user={{email:user.email??""}} title="Seu percurso" activeNav="overview" firstCurrentModule={current??null}>
 <div className="md:ml-64 p-6 md:p-10 space-y-8 max-w-6xl">
 {failed?<p role="alert">Não foi possível carregar todo o progresso. Atualize a página; nenhum resultado foi alterado.</p>:<>
 <section className="border-l-4 border-[var(--liceu-accent)] bg-[var(--liceu-surface)] p-6 space-y-4">
 <h2 className="text-3xl font-[var(--font-noto-serif)]">Continue de onde parou</h2>
 <p>{done.size} lições concluídas · {completed.size} módulos concluídos</p>
 {current?<Link className="inline-block border px-5 py-3" href={nextLesson?`/modules/${current.id}/lessons/${nextLesson.id}`:`/modules/${current.id}`}>{nextLesson?`Continuar: ${nextLesson.title}`:"Concluir quiz e módulo"}</Link>:<Link href="/conta" className="underline">Consultar acesso e assinatura</Link>}
 </section>
 <nav aria-label="Seu espaço" className="flex flex-wrap gap-6"><Link href="/me" className="underline">Histórico e produções</Link><Link href="/servicos" className="underline">Revisões e mentoria</Link><Link href="/conta" className="underline">Minha assinatura</Link></nav>
 <section className="space-y-4"><h2 className="text-2xl">Mapa de estudos</h2><p>Conclua todas as lições e alcance 70% no quiz para liberar o próximo módulo. Revisão humana é opcional.</p>
 {modules.map(m=>{const count=m.lessons.filter(l=>done.has(l.id)).length;return <article key={m.id} className="border border-[var(--liceu-stone)] p-5 space-y-3"><p className="text-xs uppercase tracking-widest">Módulo {m.order_index} · {completed.has(m.id)?"Concluído":m.accessible?"Disponível":"Bloqueado"}</p><h3 className="text-2xl">{m.title}</h3><p>{m.subtitle}</p><p>{count} / {m.lessons.length} lições</p>{m.accessible&&<div className="flex flex-wrap gap-5"><Link href={`/modules/${m.id}`} className="underline">Abrir módulo</Link><Link href={`/modules/${m.id}/flashcards`} className="underline">Revisar cartões de hoje</Link></div>}</article>;})}
 </section></>}
 </div></DashboardShell>;
}
