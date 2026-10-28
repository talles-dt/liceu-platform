import {redirect} from "next/navigation";
import {currentStaff} from "@/lib/staff";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {ReadingLayout} from "@/components/ReadingLayout";
import {AssignTeacher,TeacherOrderForm,RefundService} from "@/components/ServiceForms";
export default async function TeacherPage(){
 const staff=await currentStaff();if(!staff)redirect("/login");const db=createSupabaseAdminClient();
 const {data:teachers}=staff.role==="admin"?await db.from("users").select("id,name").in("role",["admin","teacher"]).is("suspended_at",null):{data:[]};
 let query=db.from("liceu_service_orders").select("*").order("created_at");
 if(staff.role!=="admin")query=query.eq("teacher_id",staff.user.id);
 const {data:orders,error}=await query;
 const views=await Promise.all((orders??[]).map(async o=>{let content:string|null=null;
 if(o.work_version_id&&(staff.role==="admin"||o.teacher_id===staff.user.id)){const {data,error}=await db.from("liceu_work_versions").select("content").eq("id",o.work_version_id).single();if(error)throw error;content=data.content;}
 return{...o,content};}));
 return <ReadingLayout eyebrow="LICEU / PROFESSOR" title="Acompanhamentos" subtitle="Consulte suas atribuições, defina o escopo e entregue o feedback.">
 {error?<p role="alert">Não foi possível carregar os pedidos.</p>:<div className="space-y-8">{views.map(o=><article key={o.id} className="border p-5 space-y-4"><h2>{o.kind} — {o.status}</h2><p>{o.scope}</p>{o.content&&<details><summary>Produção atribuída</summary><p className="whitespace-pre-wrap">{o.content}</p></details>}{staff.role==="admin"&&o.status==="requested"&&<AssignTeacher id={o.id} teachers={teachers??[]}/>}{staff.role==="admin"&&["refund_requested","refund_pending"].includes(o.status)&&<RefundService id={o.id}/>}<TeacherOrderForm kind={o.kind} id={o.id} status={o.status} scope={o.scope}/></article>)}</div>}
 </ReadingLayout>;
}
