import {assertAdmin} from '@/lib/admin/auth';
import {adminCount} from '@/lib/admin/queries';
import {createSupabaseAdminClient} from '@/lib/supabaseAdmin';
export default async function SystemPage(){
 if(!await assertAdmin())throw Error('Acesso administrativo necessário.');
 const tables=[['users','Contas'],['formation_cohorts','Coortes'],['formation_submissions','Versões de entregas'],['liceu_service_orders','Serviços'],['access_grants','Concessões de acesso']];
 const counts=await Promise.all(tables.map(([table])=>adminCount(table)));
 const logs=await createSupabaseAdminClient().from('audit_logs').select('id,created_at,actor_email,action,target_type,target_identifier,metadata').order('created_at',{ascending:false}).limit(50);
 return <div className="p-6 space-y-6"><h1 className="text-2xl font-serif">Sistema e auditoria</h1><p>Leituras realizadas agora. Uma tabela vazia é diferente de uma consulta indisponível.</p><ul className="space-y-2">{tables.map(([,label],i)=><li key={label}>{label}: {counts[i]===null?'consulta indisponível':`${counts[i]} registros — leitura concluída`}</li>)}</ul><h2 className="text-xl">Últimos 50 registros administrativos</h2>{logs.error?<p role="alert">Registros de auditoria indisponíveis.</p>:!logs.data?.length?<p>Nenhum registro administrativo.</p>:<div className="overflow-auto"><table className="w-full text-sm"><thead><tr>{['Data','Responsável','Ação','Registro','Motivo'].map(x=><th key={x} className="p-2 text-left">{x}</th>)}</tr></thead><tbody>{logs.data.map(l=><tr key={l.id} className="border-t"><td className="p-2">{new Date(l.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</td><td>{l.actor_email??'Sistema'}</td><td>{l.action}</td><td>{l.target_type} · {l.target_identifier}</td><td>{typeof l.metadata?.reason==='string'?l.metadata.reason:'—'}</td></tr>)}</tbody></table></div>}</div>;
}
