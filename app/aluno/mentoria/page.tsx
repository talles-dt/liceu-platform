import Link from 'next/link';
import {redirect} from 'next/navigation';
import {studentContext} from '@/lib/studentAreasServer';
import {createSupabaseAdminClient} from '@/lib/supabaseAdmin';
import {StudentAreaNav} from '@/components/StudentAreaNav';
export const dynamic="force-dynamic";
export default async function MentoringArea(){
 const context=await studentContext();if(!context)redirect('/login');
 if(!context.access.mentoring)return <main className="max-w-4xl mx-auto p-8 space-y-6"><StudentAreaNav area="mentoring"/><h1 className="text-3xl">Mentoria individual</h1><p>Você ainda não tem uma mentoria contratada. A matrícula na Formação não inclui automaticamente sessões individuais.</p><Link href="/servicos" className="underline">Consultar solicitações e propostas</Link></main>;
 const orders=context.orders.filter(o=>['paid','completed'].includes(o.status));
 // Bookings have no learner SELECT grant: only query IDs proven to belong to this user.
 const {data:bookings,error}=orders.length?await createSupabaseAdminClient().from('liceu_mentoring_bookings').select('order_id,start_time,end_time,status').in('order_id',orders.map(o=>o.id)).order('start_time'):{data:[],error:null};
 return <main className="max-w-4xl mx-auto p-6 md:p-10 space-y-8"><StudentAreaNav area="mentoring"/><header><h1 className="text-4xl font-serif">Minha mentoria</h1><p>Objetivos, sessões e devolutivas individuais.</p></header>{error&&<p role="alert">A agenda não pôde ser carregada. Confirme o horário com o professor.</p>}
 {context.manualMentoring.map(g=><section key={g.id} className="border p-6 space-y-3"><h2 className="text-2xl">Mentoria — acesso concedido pela administração</h2><p className="whitespace-pre-wrap">{String(g.metadata.scope)}</p><p>{g.expires_at?`Válido até ${new Date(g.expires_at).toLocaleDateString('pt-BR')}`:'Sem data de encerramento definida.'}</p><p>Combine com o professor a preparação e o horário dos encontros previstos neste escopo.</p></section>)}{orders.map(o=><article key={o.id} className="border p-6 space-y-4"><h2 className="text-2xl">{o.status==='completed'?'Acompanhamento concluído':'Acompanhamento em curso'}</h2><h3>Objetivo e escopo acordado</h3><p className="whitespace-pre-wrap">{o.scope}</p><h3>Sessões</h3>{bookings?.filter(b=>b.order_id===o.id).map((b,i)=><p key={i}>{new Date(b.start_time).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · horário de Brasília · {b.status==='scheduled'?'Agendada':'Cancelada'}</p>)}{!error&&!bookings?.some(b=>b.order_id===o.id)&&<p>Horário a combinar com o professor.</p>}<h3>Preparação</h3><p>Retome o objetivo acordado e reúna suas dúvidas e produções para a sessão.</p><h3>Devolutiva e próximos passos</h3><p className="whitespace-pre-wrap">{o.feedback||'Aguardando registro do professor.'}</p></article>)}
 <Link href="/servicos" className="underline">Gerenciar propostas e sessões</Link></main>;
}
