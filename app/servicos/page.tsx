import {StudentAreaNav} from "@/components/StudentAreaNav";
import {redirect} from "next/navigation";
import {getCurrentUser,createSupabaseServerClient} from "@/lib/supabaseServer";
import {ReadingLayout} from "@/components/ReadingLayout";
import {ServiceRequest,OrderPayment,CancelService} from "@/components/ServiceForms";
import {getStripeClient} from "@/lib/stripe";
export default async function ServicesPage(){
 const user=await getCurrentUser();if(!user)redirect("/login");const db=await createSupabaseServerClient();
 const [{data:works,error:workError},{data:orders,error:orderError}]=await Promise.all([
 db.from("liceu_work_versions").select("id,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),
 db.from("liceu_service_orders").select("*").eq("user_id",user.id).order("created_at",{ascending:false})]);
 const views=await Promise.all((orders??[]).map(async order=>{let price="Preço indisponível";if(order.price_id)try{const p=await getStripeClient().prices.retrieve(order.price_id);if(p.unit_amount!==null)price=new Intl.NumberFormat("pt-BR",{style:"currency",currency:p.currency}).format(p.unit_amount/100);}catch{}return{...order,price};}));
 return <ReadingLayout eyebrow="LICEU / ACOMPANHAMENTO" title="Revisão e mentoria" subtitle="Solicitação sem cobrança; pagamento apenas após proposta aceita.">
 <div className="space-y-8"><StudentAreaNav area="mentoring"/>{workError||orderError?<p role="alert">Não foi possível carregar o acompanhamento. Tente novamente.</p>:<ServiceRequest works={works??[]}/>}
 {views.map(o=><article key={o.id} className="border p-5 space-y-4"><h2 className="text-xl">{o.kind==="review"?"Revisão humana":"Sessão de mentoria"} — {o.status}</h2><p>{o.scope}</p>{o.due_at&&<p>Prazo/horário: {new Date(o.due_at).toLocaleString("pt-BR")}. {o.duration_minutes&&`${o.duration_minutes} minutos.`}</p>}{o.status==="offered"&&<><p>{o.price}</p><OrderPayment id={o.id}/></>}<CancelService id={o.id} status={o.status}/>{o.rubric?.observations&&<dl>{Object.entries(o.rubric.observations).map(([k,v])=><div key={k}><dt>{{clarity:"Clareza",argument:"Argumentação",audience:"Adequação à audiência"}[k]??k}</dt><dd>{String(v)}</dd></div>)}</dl>}{o.feedback&&<div className="whitespace-pre-wrap"><h3>Feedback recebido</h3>{o.feedback}</div>}</article>)}</div>
 </ReadingLayout>;
}
