import {ReviewErasure} from "@/components/PrivacyForms";
import {redirect} from "next/navigation";
import {assertAdmin} from "@/lib/admin/auth";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {ReadingLayout} from "@/components/ReadingLayout";
import {ReplayEvent,LegacyResolution} from "@/components/OperationsForms";
export default async function Operations(){
 const user=await assertAdmin();if(!user)redirect("/login");
 const db=createSupabaseAdminClient();
 // eslint-disable-next-line react-hooks/purity -- Uncached server request evaluates retention deadlines.
 const requestTime=Date.now();
 const [events,legacy,audit,privacy]=await Promise.all([
 db.from("liceu_webhook_inbox").select("provider,event_id,status,attempts,updated_at").neq("status","done").order("updated_at").limit(100),
 db.from("liceu_legacy_billing_events").select("event_id,created_at").is("resolved_at",null).order("created_at").limit(100),
 db.from("liceu_audit_events").select("*").order("id",{ascending:false}).limit(100),
 db.from("liceu_privacy_requests").select("*").order("requested_at").limit(100)]);
 return <ReadingLayout eyebrow="ADMINISTRAÇÃO" title="Operações pendentes" subtitle="Até 100 registros por seção. Resolva a causa antes de repetir uma operação.">
 {[events,legacy,audit,privacy].some(r=>r.error)&&<p role="alert">Não foi possível carregar todos os registros.</p>}
 <h2>Pedidos de privacidade</h2>{privacy.data?.map(p=><details className="border p-4 my-3" key={p.id}><summary>{p.user_id} · {p.status} · {p.step}</summary><p>{p.last_error}</p><p>Retenção: {p.retention_reason} · revisar em {p.retention_until}</p>{p.retention_until&&Date.parse(p.retention_until)<requestTime&&<p role="alert">Prazo de revisão da retenção vencido. Revisar os registros remanescentes.</p>}{p.status!=="completed"&&<ReviewErasure id={p.id} status={p.status}/>}</details>)}
 <h2>Eventos de cobrança e agenda</h2>{events.data?.map(e=><article className="border p-4 my-3" key={e.provider+e.event_id}><p>{e.provider} · {e.event_id} · {e.status} · {e.attempts} tentativas</p><ReplayEvent provider={e.provider} eventId={e.event_id}/></article>)}
 <h2>Compras antigas sem conciliação</h2>{legacy.data?.map(e=><details className="border p-4 my-3" key={e.event_id}><summary>{e.event_id}</summary><LegacyResolution eventId={e.event_id}/></details>)}
 <h2>Últimas alterações registradas</h2>{audit.data?.map(a=><p key={a.id}>{a.created_at} · {a.action} · {a.target_type} · {a.target_id} · {a.actor_id??"sistema"}</p>)}
 </ReadingLayout>;
}
