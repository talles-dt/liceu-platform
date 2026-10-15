import {notFound,redirect} from "next/navigation";
import {assertAdmin} from "@/lib/admin/auth";
import {uuid} from "@/lib/formation/server";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {LessonContentEditor} from "@/components/LessonContentEditor";
export default async function LessonEditor({params}:{params:Promise<{lessonId:string}>}){
 if(!await assertAdmin())redirect("/login");const {lessonId}=await params;if(!uuid(lessonId))notFound();
 const db=createSupabaseAdminClient(),[lesson,theory]=await Promise.all([
 db.from("liceu_lessons").select("id,module_id,title,cloudflare_stream_id").eq("id",lessonId).maybeSingle(),
 db.from("liceu_theoretical_content").select("id,title,content_markdown").eq("lesson_id",lessonId).order("section_order")]);
 if(lesson.error||theory.error)return <p role="alert">Não foi possível carregar o conteúdo. Nenhuma alteração foi feita.</p>;
 if(!lesson.data)notFound();const l=lesson.data;
 return <main className="p-8 space-y-8"><a className="underline" href="/admin/content">Voltar ao conteúdo</a><h1 className="text-3xl">{l.title}</h1><LessonContentEditor moduleId={l.module_id} lessonId={l.id} initial={l.cloudflare_stream_id??""} video/>
 {theory.data?.map(s=><section className="space-y-3 border-t pt-6" key={s.id}><h2>{s.title}</h2><LessonContentEditor moduleId={l.module_id} lessonId={l.id} sectionId={s.id} initial={s.content_markdown}/></section>)}
 {!theory.data?.length&&<p>Esta lição ainda não possui seções editoriais. A criação e publicação do conteúdo exigem revisão curricular.</p>}</main>;
}
