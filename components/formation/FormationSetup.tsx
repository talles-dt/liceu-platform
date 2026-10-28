'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import type {Cohort,Person} from '@/lib/admin/queries';
import type {Membership} from '@/lib/admin/access';
export type FormationSetupProps={currentUserId:string;releases:{id:string;version:string}[];people:Person[];cohorts:Cohort[];members:Membership[]};
const field='block w-full border p-2 mt-1 bg-[var(--liceu-bg)]';
const roles:Record<string,string>={teacher:'Professor',participant:'Participante',evaluator:'Avaliador convidado'};
export function FormationSetup({currentUserId,releases,people,cohorts,members}:FormationSetupProps){
 const router=useRouter();const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 const [created,setCreated]=useState<string|null>(null);
 const [cohortId,setCohortId]=useState(cohorts.find(c=>c.status!=='closed')?.id??'');
 const [personId,setPersonId]=useState(currentUserId);
 const enabled=people.filter(p=>!p.suspended_at);
 const editions=[...releases].sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
 const personLabel=(p:Person)=>`${p.id===currentUserId?'Eu — ':''}${p.name||p.email}${p.name?' ('+p.email+')':''}`;
 const existing=members.find(m=>m.cohort_id===cohortId&&m.user_id===personId);
 async function send(url:string,body:unknown){
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível salvar.');return data;
 }
 return <div className="space-y-6">
 <p role="status" aria-live="polite">{notice}</p>{created&&<Link className="block underline" href={`/formacoes/${created}`}>Abrir minha coorte como professor</Link>}
 <section className="border p-5 space-y-3"><h2 className="text-xl font-serif">Criar coorte</h2><p>Escolha a edição e o professor responsável. Ao criar, o professor já recebe acesso à coorte e aos guias docentes.</p>
 {!editions.length?<p>Nenhuma edição curricular publicada. A criação ficará disponível após a publicação do currículo.</p>:<form aria-label="Criar coorte" onSubmit={async e=>{
  e.preventDefault();const form=e.currentTarget;const values=new FormData(form);setBusy(true);setNotice('');setCreated(null);
  try{const data=await send('/api/formations',{action:'create_cohort',title:String(values.get('title')).trim(),release_id:values.get('release_id'),teacher_id:values.get('teacher_id')});setNotice('Coorte criada. O professor responsável já tem acesso.');if(values.get('teacher_id')===currentUserId)setCreated(data.cohortId);setCohortId(data.cohortId);form.reset();router.refresh();}catch(error){setNotice(error instanceof Error?error.message:'Não foi possível confirmar a criação. Recarregue antes de tentar novamente.');}finally{setBusy(false);}
 }}><fieldset disabled={busy} className="space-y-4">
 <label className="block">Nome da coorte<input className={field} name="title" required maxLength={159} placeholder="Ex.: Coorte fundadora — 2026"/></label>
 <label className="block">Edição curricular<select className={field} name="release_id" defaultValue={editions[0].id}>{editions.map(r=><option key={r.id} value={r.id}>Formação Intelectual — edição {r.version}</option>)}</select></label>
 <label className="block">Professor responsável<select className={field} name="teacher_id" defaultValue={currentUserId}>{enabled.map(p=><option key={p.id} value={p.id}>{personLabel(p)}</option>)}</select></label>
 <button className="border p-3" type="submit">{busy?'Salvando…':'Criar coorte e dar acesso ao professor'}</button>
 </fieldset></form>}</section>
 <section className="border p-5 space-y-3"><h2 className="text-xl font-serif">Dar acesso a uma coorte existente</h2>
 {!cohorts.some(c=>c.status!=='closed')?<p>Crie a primeira coorte acima. Seu acesso como professor será incluído na criação.</p>:<form aria-label="Dar acesso à coorte" onSubmit={async e=>{
  e.preventDefault();const values=new FormData(e.currentTarget);setBusy(true);setNotice('');
  try{await send(`/api/formations/${cohortId}`,{action:'enroll',body:{user_id:personId,role:values.get('role')}});setNotice('Acesso concedido. A coorte já está disponível para a pessoa selecionada.');router.refresh();}catch(error){setNotice(error instanceof Error?error.message:'Não foi possível confirmar o acesso. Recarregue antes de tentar novamente.');}finally{setBusy(false);}
 }}><fieldset disabled={busy} className="space-y-4">
 <label className="block">Coorte<select className={field} required value={cohortId} onChange={e=>setCohortId(e.target.value)}><option value="" disabled>Escolha a coorte</option>{cohorts.filter(c=>c.status!=='closed').map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
 <label className="block">Pessoa<select className={field} required value={personId} onChange={e=>setPersonId(e.target.value)}>{enabled.map(p=><option key={p.id} value={p.id}>{personLabel(p)}</option>)}</select></label>
 {existing?<p>Esta pessoa já está vinculada como {roles[existing.role]??existing.role}. {existing.status==='active'?'Acesso ativo.':'Situação: '+({paused:'pausada',withdrawn:'retirada',completed:'concluída'} as Record<string,string>)[existing.status]+'.'}{personId===currentUserId&&['active','completed'].includes(existing.status)&&<Link className="block underline" href={`/formacoes/${cohortId}`}>Abrir minha coorte</Link>}</p>:<><label className="block">Papel na coorte<select className={field} name="role" defaultValue="teacher"><option value="teacher">Professor</option><option value="participant">Participante</option><option value="evaluator">Avaliador convidado</option></select></label><p className="text-sm">Professores podem conduzir encontros e avaliar produções. Participantes ocupam uma das seis vagas do piloto.</p><button className="border p-3">{busy?'Salvando…':'Conceder acesso'}</button></>}
 </fieldset></form>}</section>
<div className="my-4"><p>Materiais da formação — edição 0.4.0.</p><p>Palavras para começar: {(['welcome','notebook','glossary','teacher'] as const).map((entry,i)=><a key={entry} className="underline mr-3" href={`/api/formations/preview/materials?entry=${entry}&release=0.4.0`} target="_blank" rel="noreferrer">{['Acolhimento','Caderno de entrada','Glossário','Guia docente'][i]}</a>)}</p><ul>{[1,2,3,4,5,6].map(n=><li key={n}>Módulo {n}: <a className="underline" href={`/api/formations/preview/materials?kind=participant&module=c0${n}&release=0.4.0`} target="_blank" rel="noreferrer">Caderno</a> · <a className="underline" href={`/api/formations/preview/materials?kind=teacher&module=c0${n}&release=0.4.0`} target="_blank" rel="noreferrer">Guia docente</a></li>)}</ul><a className="underline" target="_blank" rel="noreferrer" href="/api/formations/preview/materials?kind=participant&module=c01&release=0.2.0">Arquivo histórico do módulo 1 (0.2.0)</a></div>
 </div>;
}
