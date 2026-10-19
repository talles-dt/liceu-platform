import {getAdminSnapshot,adminRows} from '@/lib/admin/queries';
export default async function ProgressPage(){
 const s=await getAdminSnapshot();
 const [submissions,performances,assessments]=await Promise.all([
 adminRows<{id:string;cohort_id:string;user_id:string;activity_id:string}>('formation_submissions','id,cohort_id,user_id,activity_id'),
 adminRows<{id:string;cohort_id:string}>('formation_performances','id,cohort_id'),
 adminRows<{id:string;cohort_id:string}>('formation_assessments','id,cohort_id'),
 ]);
 return <div className="p-6 space-y-6"><header><h1 className="text-2xl font-serif">Acompanhamento da Formação</h1><p>Evidências registradas por coorte. Quantidade de entregas não equivale a domínio dos três pilares.</p></header>{!s.cohorts.length&&<p>Nenhuma coorte cadastrada. Os indicadores aparecerão quando houver atividades e registros.</p>}{s.cohorts.map(c=>{const own=submissions.filter(x=>x.cohort_id===c.id);return <section className="border p-4 space-y-2" key={c.id}><h2 className="text-xl">{c.title}</h2><p>{new Set(own.map(x=>x.user_id)).size} participantes com entrega registrada</p><p>{new Set(own.map(x=>`${x.user_id}/${x.activity_id}`)).size} produções · {own.length} versões entregues</p><p>{performances.filter(x=>x.cohort_id===c.id).length} performances · {assessments.filter(x=>x.cohort_id===c.id).length} avaliações registradas</p></section>})}<p className="text-sm">Tempo de estudo, dificuldade e progresso formativo não são inferidos automaticamente. A avaliação permanece docente, apoiada nas produções, rubricas e devolutivas.</p></div>;
}
